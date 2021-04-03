import {SES} from 'aws-sdk';
import {renderToStaticMarkup} from 'react-dom/server';
import {Email} from './Email';

export async function handler() {
  const {Welcome} = await import('./emails/Welcome');

  const content = renderToStaticMarkup(
    <Email>
      <Welcome />
    </Email>,
  );

  const ses = new SES();

  const email: SES.Types.SendEmailRequest = {
    Source: `${JSON.stringify('Welcome Bot')} <hello@lemon.tools>`,
    Destination: {
      ToAddresses: ['chrismsauve@gmail.com'],
    },
    Message: {
      Subject: {Data: 'Test email'},
      Body: {
        Html: {Data: content},
      },
    },
  };

  await ses.sendEmail(email).promise();
}
