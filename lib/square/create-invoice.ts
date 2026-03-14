import { squareClient, squareConfig } from './client';
import { randomUUID } from 'crypto';

export interface CustomerCardResult {
  success: true;
  customerId: string;
  cardId: string;
}

export interface InvoiceResult {
  success: true;
  invoiceId: string;
}

export interface SquareFailure {
  success: false;
  error: string;
}

/**
 * Finds an existing Square Customer by email or creates one.
 * Then saves the payment nonce as a Card on File, returning the
 * customerId and cardId needed for future auto-charges.
 */
export async function createCustomerAndSaveCard(
  sourceId: string,
  email: string,
  name: string,
): Promise<CustomerCardResult | SquareFailure> {
  try {
    let customerId: string;

    const searchResponse = await squareClient.customers.search({
      query: { filter: { emailAddress: { exact: email } } },
    });

    const existing = searchResponse.customers;
    if (existing?.length) {
      customerId = existing[0].id!;
    } else {
      const nameParts = name.trim().split(' ');
      const createResponse = await squareClient.customers.create({
        idempotencyKey: randomUUID(),
        emailAddress: email,
        givenName: nameParts[0],
        familyName: nameParts.slice(1).join(' ') || undefined,
      });
      if (!createResponse.customer?.id) {
        const detail = createResponse.errors?.[0]?.detail ?? 'Failed to create customer.';
        return { success: false, error: detail };
      }
      customerId = createResponse.customer.id;
    }

    const cardResponse = await squareClient.cards.create({
      idempotencyKey: randomUUID(),
      sourceId,
      card: { customerId },
    });

    if (!cardResponse.card?.id) {
      const detail = cardResponse.errors?.[0]?.detail ?? 'Failed to save card on file.';
      return { success: false, error: detail };
    }

    return { success: true, customerId, cardId: cardResponse.card.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error saving card.' };
  }
}

/**
 * Creates a Square Order for the remaining two installments, then
 * creates and publishes an Invoice that auto-charges the saved card
 * on the two future due dates.
 */
export async function createMonthlyInvoice(params: {
  customerId: string;
  cardId: string;
  month2Cents: number;
  month2Date: string; // YYYY-MM-DD
  month3Cents: number;
  month3Date: string; // YYYY-MM-DD
  bookingId: string;
}): Promise<InvoiceResult | SquareFailure> {
  const { customerId, cardId, month2Cents, month2Date, month3Cents, month3Date, bookingId } = params;

  try {
    // Square Invoices require an Order; create one covering installments 2 and 3.
    const orderResponse = await squareClient.orders.create({
      order: {
        locationId: squareConfig.locationId!,
        customerId,
        referenceId: bookingId,
        lineItems: [
          {
            name: 'NoTime Storage – Installment 2 of 3',
            quantity: '1',
            basePriceMoney: { amount: BigInt(month2Cents), currency: 'USD' },
          },
          {
            name: 'NoTime Storage – Installment 3 of 3',
            quantity: '1',
            basePriceMoney: { amount: BigInt(month3Cents), currency: 'USD' },
          },
        ],
      },
      idempotencyKey: randomUUID(),
    });

    if (!orderResponse.order?.id) {
      const detail = orderResponse.errors?.[0]?.detail ?? 'Failed to create payment order.';
      return { success: false, error: detail };
    }

    const invoiceResponse = await squareClient.invoices.create({
      invoice: {
        locationId: squareConfig.locationId!,
        orderId: orderResponse.order.id,
        primaryRecipient: { customerId },
        title: `NoTime Storage – Booking ${bookingId}`,
        deliveryMethod: 'CHARGE_CARD_ON_FILE',
        paymentRequests: [
          {
            requestType: 'INSTALLMENT',
            dueDate: month2Date,
            fixedAmountRequestedMoney: { amount: BigInt(month2Cents), currency: 'USD' },
            automaticPaymentSource: 'CARD_ON_FILE',
            cardId,
          },
          {
            requestType: 'INSTALLMENT',
            dueDate: month3Date,
            fixedAmountRequestedMoney: { amount: BigInt(month3Cents), currency: 'USD' },
            automaticPaymentSource: 'CARD_ON_FILE',
            cardId,
          },
        ],
      },
      idempotencyKey: randomUUID(),
    });

    if (!invoiceResponse.invoice?.id) {
      const detail = invoiceResponse.errors?.[0]?.detail ?? 'Failed to create invoice.';
      return { success: false, error: detail };
    }

    // Publish so Square schedules the auto-charges.
    const publishResponse = await squareClient.invoices.publish({
      invoiceId: invoiceResponse.invoice.id,
      version: invoiceResponse.invoice.version ?? 0,
      idempotencyKey: randomUUID(),
    });

    if (!publishResponse.invoice?.id) {
      const detail = publishResponse.errors?.[0]?.detail ?? 'Failed to publish invoice.';
      return { success: false, error: detail };
    }

    return { success: true, invoiceId: publishResponse.invoice.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error creating invoice.' };
  }
}
