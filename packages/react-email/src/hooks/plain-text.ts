import type {EmailManager} from '../manager';
import {useEmailAction} from './email-action';

export function usePlainTextEmail(
  text: Parameters<EmailManager['setPlainText']>[0],
) {
  return useEmailAction((email) => email.setPlainText(text));
}
