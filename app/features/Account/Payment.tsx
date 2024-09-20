import {
  createRef,
  type RefObject,
  type ComponentProps,
  type RenderableProps,
} from 'preact';
import {useEffect, useMemo} from 'preact/hooks';
import type {Stripe, StripeElements} from '@stripe/stripe-js';
import {useRouter, Redirect, useCurrentURL} from '@quilted/quilt/navigation';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {
  signal,
  useSignal,
  useComputed,
  useSignalEffect,
  type Signal,
} from '@quilted/quilt/signals';
import {createOptionalContext} from '@quilted/quilt/context';
import {Button, BlockStack, Form, Banner} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
} from '~/shared/graphql.ts';
import {SearchParam, PaymentStatus} from '~/global/subscriptions.ts';

import subscriptionPaymentQuery from './graphql/SubscriptionPaymentQuery.graphql';

export default function Payment() {
  const router = useRouter();
  const currentUrl = useCurrentURL();

  const query = useGraphQLQuery(subscriptionPaymentQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {my} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  const error = useSignal(
    currentUrl.searchParams.get(SearchParam.PaymentStatus) ===
      PaymentStatus.Failed,
  );

  const subscription = my.subscription;
  const paymentFlow = subscription?.paymentFlow;

  // TODO: show subscription picker inline
  if (paymentFlow == null) {
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
            await query.rerun();
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
            <Banner tone="critical">
              There was an error processing your payment. Please try again.
            </Banner>
          )}

          <StripeContent />

          <Button perform="submit" emphasis>
            Subscribe
          </Button>
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
const useStripeForm = StripeFormContext.use;

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
}: RenderableProps<
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
