import {SES} from 'aws-sdk';
import type {SQSHandler} from 'aws-lambda';
import {runEmail, Html, render} from '@lemon/react-email';
import type {Sender} from '@lemon/react-email';

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

  const {markup, html, email} = await runEmail(
    <Email type={type as any} props={props} />,
  );

  const {
    subject,
    to,
    cc,
    bcc,
    plainText,
    sender: {name: senderName, email: senderEmail} = DEFAULT_SENDER,
  } = email.state;

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
        Html: {Data: render(<Html manager={html}>{markup}</Html>)},
        Text: plainText == null ? undefined : {Data: plainText},
      },
    },
  };

  await ses.sendEmail(sesEmail).promise();
};

export default sendEmail;
