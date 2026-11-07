# Real HTTP over private Unix sockets; authorization only, no JWT authentication.
# The runner creates/destroys the database and supplies fixed fixture identities.
import http.client,socket,json,sys,urllib.parse,datetime
root=sys.argv[1]
class UnixHTTP(http.client.HTTPConnection):
 def __init__(self,path): super().__init__('localhost',timeout=15); self.path=path
 def connect(self): self.sock=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM); self.sock.settimeout(self.timeout); self.sock.connect(self.path)
member='a1000000-0000-0000-0000-0000000000a1'; owner='a0000000-0000-0000-0000-00000000000a'; teacher='b0000000-0000-0000-0000-00000000000b'; other='b1000000-0000-0000-0000-0000000000b1'
studio='aaaaaaaa-0000-0000-0000-000000000001'; occ='aaaaaaaa-3000-0000-0000-000000000001'
results=[]
def req(role,method,path,query=None,body=None,actor=None,prefer=None):
 c=UnixHTTP(f'{root}/{role}.sock'); headers={'Content-Type':'application/json'}
 if actor: headers['X-Synthetic-Profile']=actor
 if prefer: headers['Prefer']=prefer
 if query:path+='?'+urllib.parse.urlencode(query)
 c.request(method,path,json.dumps(body) if body is not None else None,headers)
 r=c.getresponse(); raw=r.read(); c.close()
 try: data=json.loads(raw) if raw else None
 except: data=raw.decode()[:1000]
 return r.status,data

def check(name,r,status=200,predicate=lambda d:True):
 code,data=r
 if code!=status or not predicate(data):raise AssertionError(f'{name}: status={code}, body={data}')
 results.append({'name':name,'status':code,'result':'PASS'});print('PASS',name,code,flush=True); return data

def denied(name,r):
 code,data=r
 if code not in (401,403) or not isinstance(data,dict) or data.get('code')!='42501':raise AssertionError(f'{name}: {code} {data}')
 results.append({'name':name,'status':code,'sqlstate':'42501','result':'PASS'});print('PASS',name,code,'42501',flush=True)
for role,actor in [('anon',None),('authenticated',member),('service_role',None)]:
 check('actual-role-'+role,req(role,'POST','/rpc/http_test_identity',body={},actor=actor),predicate=lambda d,r=role,a=actor:d['role']==r and d['profile']==a)
check('anon-discovery',req('anon','POST','/rpc/discover_classes',body={}),predicate=lambda d:len(d)>0)
check('anon-contact-insert',req('anon','POST','/messages',body={'type':'studio_inquiry','studio_id':studio,'subject':'Synthetic HTTP','body':'Test only'}),201)
denied('anon-no-profiles',req('anon','GET','/profiles',{'select':'id'}))
check('member-own-profile',req('authenticated','GET','/profiles',{'select':'id,first_name','id':'eq.'+member},actor=member),predicate=lambda d:len(d)==1 and d[0]['id']==member)
check('member-profile-patch-returning',req('authenticated','PATCH','/profiles',{'id':'eq.'+member,'select':'id,first_name'},body={'first_name':'Synthetic HTTP Member'},actor=member,prefer='return=representation'),predicate=lambda d:len(d)==1 and d[0]['first_name']=='Synthetic HTTP Member')
check('member-other-profile-hidden',req('authenticated','GET','/profiles',{'select':'id','id':'eq.'+other},actor=member),predicate=lambda d:d==[])
settings='id,name,slug,email,phone,website,timezone,currency,brand_primary_color,brand_secondary_color,default_cancellation_minutes,late_cancel_fee_cents,no_show_fee_cents,waitlist_enabled,max_waitlist_size,discoverable,express_booking_enabled,page_live'
check('member-studio-settings-projection',req('authenticated','GET','/studios',{'select':settings,'id':'eq.'+studio},actor=member),predicate=lambda d:len(d)==1)
denied('member-no-stripe',req('authenticated','GET','/studios',{'select':'stripe_account_id','id':'eq.'+studio},actor=member))
denied('member-no-studio-wildcard',req('authenticated','GET','/studios',{'select':'*','id':'eq.'+studio},actor=member))
columns='id,starts_at,ends_at,capacity,is_cancelled,offering:offerings(name),studio:studios(timezone),bookings(status),refund_requests(status),class_cancel_notices(status,refund_told)'
check('teacher-schedule-exact-embedding',req('authenticated','GET','/class_occurrences',{'select':columns,'studio_id':'eq.'+studio,'id':'eq.'+occ,'order':'starts_at'},actor=teacher),predicate=lambda d:len(d)==1 and len(d[0]['class_cancel_notices'])==1 and d[0]['studio']['timezone'])
check('teacher-owed-refund-filter',req('authenticated','GET','/refund_requests',{'select':'occurrence_id','studio_id':'eq.'+studio,'status':'neq.sent'},actor=teacher))
check('teacher-owed-notice-filter',req('authenticated','GET','/class_cancel_notices',{'select':'occurrence_id','studio_id':'eq.'+studio,'or':'(status.in.(pending,sending,failed,unknown,no_email),and(status.in.(sent,handled),refund_told.eq.failed))'},actor=teacher),predicate=lambda d:len(d)==1)
for col in ['person','email','message','last_error']:
 denied('teacher-no-notice-'+col,req('authenticated','GET','/class_cancel_notices',{'select':col,'studio_id':'eq.'+studio},actor=teacher))
for col in ['stripe_refund_id','amount_cents','last_error']:
 denied('teacher-no-refund-'+col,req('authenticated','GET','/refund_requests',{'select':col},actor=teacher))
denied('teacher-no-followup-rpc',req('authenticated','POST','/rpc/class_cancel_followup',body={'p_occurrence_id':occ},actor=teacher))
check('owner-followup-rpc',req('authenticated','POST','/rpc/class_cancel_followup',body={'p_occurrence_id':occ},actor=owner),predicate=lambda d:d['people'][0]['first_name']=='Synthetic HTTP attendee')
check('owner-settings-patch',req('authenticated','PATCH','/studios',{'id':'eq.'+studio,'select':'id,website'},body={'website':'https://synthetic.example.test'},actor=owner,prefer='return=representation'),predicate=lambda d:d[0]['website']=='https://synthetic.example.test')
for enabled in (False,True):
 check('owner-settings-upsert-'+str(enabled),req('authenticated','POST','/automation_settings',{'on_conflict':'studio_id'},body={'studio_id':studio,'guest_to_member_enabled':enabled},actor=owner,prefer='resolution=merge-duplicates'),200 if enabled else 201)
 check('owner-settings-upsert-persisted-'+str(enabled),req('authenticated','GET','/automation_settings',{'select':'guest_to_member_enabled','studio_id':'eq.'+studio},actor=owner),predicate=lambda d:d[0]['guest_to_member_enabled'] is enabled)
check('member-entitlement-embedding',req('authenticated','GET','/class_packs',{'select':'*,class_pack_type:class_pack_types(*)','profile_id':'eq.'+member},actor=member),predicate=lambda d:len(d)>0)
check('service-cancellation-read',req('service_role','GET','/class_cancel_notices',{'select':'email,message','studio_id':'eq.'+studio}),predicate=lambda d:d[0]['email']=='synthetic-http@example.test')
check('service-notice-update',req('service_role','PATCH','/class_cancel_notices',{'occurrence_id':'eq.'+occ,'select':'status'},body={'status':'sent'},prefer='return=representation'),predicate=lambda d:d[0]['status']=='sent')
denied('service-no-transactions',req('service_role','GET','/transactions',{'select':'*'}))
denied('member-no-direct-booking-write',req('authenticated','PATCH','/bookings',{'studio_id':'eq.'+studio},body={'status':'cancelled'},actor=member))
print(json.dumps({'postgrest':'16.5','transport':'HTTP over private Unix sockets','authentication':'No credentials or JWTs; fixed database roles with fixture-only claims hook','results':results},indent=2))
