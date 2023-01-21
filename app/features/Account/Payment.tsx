import {
  useEffect,
  useMemo,
  createRef,
  type RefObject,
  type ComponentProps,
} from 'react';
import type {Stripe, StripeElements} from '@stripe/stripe-js';
import {
  useSignalEffect,
  useRouter,
  Redirect,
  useComputed,
  PropsWithChildren,
  createOptionalContext,
  Signal,
  signal,
  createUseContextHook,
  useCurrentUrl,
  useSignal,
  usePerformanceNavigation,
} from '@quilted/quilt';
import {Action, BlockStack, Form, Banner} from '@lemon/zest';

import {Page} from '~/shared/page';
import {useQuery} from '~/shared/graphql';
import {SearchParam, PaymentStatus} from '~/global/subscriptions';

import subscriptionPaymentQuery from './graphql/SubscriptionPaymentQuery.graphql';

export default function Payment() {
  const router = useRouter();
  const currentUrl = useCurrentUrl();
  const {data, isLoading, refetch} = useQuery(subscriptionPaymentQuery);

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  const error = useSignal(
    currentUrl.searchParams.get(SearchParam.PaymentStatus) ===
      PaymentStatus.Failed,
  );

  const subscription = data?.my.subscription;
  const paymentFlow = subscription?.paymentFlow;

  // TODO: show subscription picker inline
  if (paymentFlow == null && !isLoading) {
    return <Redirect to="/app/me" />;
  }

  return (
    <Page heading="Subscription">
      <StripeForm
        apiKey={paymentFlow?.apiKey}
        clientSecret={paymentFlow?.clientSecret}
        onSubmit={async (stripe, elements) => {
          const result = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
            confirmParams: {
              return_url: router.resolve('/internal/stripe/return').url.href,
            },
          });

          if (result.error) {
            error.value = true;
            await refetch();
          } else {
            router.navigate(
              (url) => {
                const newUrl = new URL('../me', url);
                newUrl.searchParams.set(
                  SearchParam.PaymentStatus,
                  PaymentStatus.Success,
                );

                return newUrl;
              },
              {replace: true},
            );
          }
        }}
      >
        <BlockStack spacing>
          {error.value && (
            <Banner status="error">
              There was an error processing your payment. Please try again.
            </Banner>
          )}

          <StripeContent />

          <Action perform="submit" emphasis>
            Subscribe
          </Action>
        </BlockStack>
      </StripeForm>
    </Page>
  );
}

interface StripeForm {
  stripe: Signal<Stripe | undefined>;
  elements: Signal<StripeElements | undefined>;
  content: RefObject<HTMLDivElement>;
}

const StripeFormContext = createOptionalContext<StripeForm>();
const useStripeForm = createUseContextHook(StripeFormContext);

function StripeContent() {
  const {elements, content} = useStripeForm();

  const loading = elements.value == null;

  return (
    <div ref={content} style={loading ? {minHeight: '20rem'} : undefined} />
  );
}

function StripeForm({
  apiKey,
  clientSecret,
  children,
  onSubmit,
}: PropsWithChildren<
  {
    apiKey?: string;
    clientSecret?: string;
    onSubmit(stripe: Stripe, elements: StripeElements): void | Promise<void>;
  } & Omit<ComponentProps<typeof Form>, 'onSubmit'>
>) {
  const stripeForm = useMemo<StripeForm>(() => {
    return {
      stripe: signal(undefined),
      elements: signal(undefined),
      content: createRef(),
    };
  }, []);

  const disabled = useComputed(
    () => stripeForm.stripe.value == null,
    [stripeForm],
  );

  useEffect(() => {
    createElements();

    async function createElements() {
      if (apiKey == null || clientSecret == null) return;

      const {loadStripe} = await import('@stripe/stripe-js');

      const stripe = await loadStripe(apiKey);

      if (stripe == null) {
        throw new Error();
      }

      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'night',
        },
      });

      stripeForm.stripe.value = stripe;
      stripeForm.elements.value = elements;
    }
  }, [apiKey, clientSecret, stripeForm]);

  useSignalEffect(() => {
    const content = stripeForm.content;
    const elements = stripeForm.elements.value;

    if (elements == null || content.current == null) {
      return;
    }

    const paymentElement = elements.create('payment');
    paymentElement.mount(content.current);
  });

  return (
    <StripeFormContext.Provider value={stripeForm}>
      <Form
        disabled={disabled}
        onSubmit={async () => {
          const stripe = stripeForm.stripe.value;
          const elements = stripeForm.elements.value;

          if (stripe == null || elements == null) return;

          await onSubmit(stripe, elements);
        }}
      >
        {children}
      </Form>
    </StripeFormContext.Provider>
  );
}
