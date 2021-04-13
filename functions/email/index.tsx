import {SES} from 'aws-sdk';
import type {SQSHandler} from 'aws-lambda';

import {renderEmail} from '@quilted/quilt/server';
import type {Sender} from '@quilted/quilt/email';

import {Email} from './Email';

export type {EmailType, PropsForEmail} from './types';

const DEFAULT_SENDER: Sender = {
  email: 'no-reply@lemon.tools',
};

const sendEmail: SQSHandler = async (event) => {
  // eslint-disable-next-line no-console
  console.log(event);
  const {
    Records: [
      {
        body: propsJson,
        messageAttributes: {
          type: {stringValue: type},
        },
      },
    ],
  } = event;

  const props = JSON.parse(propsJson);

  const {
    subject,
    to,
    cc,
    bcc,
    html,
    plainText,
    sender: {name: senderName, email: senderEmail} = DEFAULT_SENDER,
  } = await renderEmail(<Email type={type as any} props={props} />);

  if (to == null || to.length === 0 || subject == null) {
    throw new Error();
  }

  const ses = new SES();
  const sender = senderName
    ? `${JSON.stringify(senderName)} <${senderEmail}>`
    : senderEmail;

  // eslint-disable-next-line no-console
  console.log(`Sending ${type} email:`);
  // eslint-disable-next-line no-console
  console.log({sender, subject, to, cc, bcc});

  const sesEmail: SES.Types.SendEmailRequest = {
    Source: sender,
    Destination: {
      ToAddresses: to,
      CcAddresses: cc,
      BccAddresses: bcc,
    },
    Message: {
      Subject: {Data: subject},
      Body: {
        Html: {Data: html},
        Text: plainText == null ? undefined : {Data: plainText},
      },
    },
  };

  await ses.sendEmail(sesEmail).promise();
};

export default sendEmail;
