import { describe, expect, it } from 'vitest';
import { passwordResetEmail, studioInquiryNotificationEmail } from '../../supabase/functions/email/templates';

describe('transactional email content safety', () => {
  it('renders submitted inquiry content as text while retaining the plain-text message', () => {
    const content = '<img src=x onerror="alert(1)"> & hello';
    const message = studioInquiryNotificationEmail({
      studioName: content, senderName: content, senderEmail: content,
      messageSubject: content, messageBody: content,
      manageUrl: 'https://tandavastudio.com/manage?one=1&two=2',
    });
    expect(message.html).not.toContain('<img');
    expect(message.html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; hello');
    expect(message.html).toContain('href="https://tandavastudio.com/manage?one=1&amp;two=2"');
    expect(message.text).toContain(content);
  });

  it.each(['javascript:alert(1)', 'data:text/html,test', 'https://user:password@example.test', 'http://example.test'])('rejects an unsafe action link: %s', resetUrl => {
    expect(() => passwordResetEmail({ firstName: 'Member', resetUrl })).toThrow();
  });
});
