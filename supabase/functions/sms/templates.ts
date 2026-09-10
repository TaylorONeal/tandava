/**
 * SMS Templates — short, plain-text bodies for transactional texts.
 */

export interface SmsTemplateResult {
  body: string;
}

export function classReminderSms(data: {
  firstName: string;
  className: string;
  timeUntil: string;
  studioName: string;
}): SmsTemplateResult {
  return {
    body: `Hi ${data.firstName}, reminder: ${data.className} at ${data.studioName} ${data.timeUntil}. See you on the mat!`,
  };
}

export function waitlistPromotedSms(data: {
  firstName: string;
  className: string;
  dateTime: string;
}): SmsTemplateResult {
  return {
    body: `${data.firstName}, a spot opened in ${data.className} (${data.dateTime}). You're now booked — reply to cancel.`,
  };
}

export function classCancelledSms(data: {
  firstName: string;
  className: string;
  dateTime: string;
}): SmsTemplateResult {
  return {
    body: `Heads up ${data.firstName}: ${data.className} on ${data.dateTime} was cancelled. Sorry for the change!`,
  };
}

export function bookingConfirmationSms(data: {
  firstName: string;
  className: string;
  dateTime: string;
}): SmsTemplateResult {
  return {
    body: `You're booked, ${data.firstName}! ${data.className} on ${data.dateTime}.`,
  };
}
