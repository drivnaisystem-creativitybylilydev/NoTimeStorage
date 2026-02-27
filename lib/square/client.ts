'use server';

import { SquareClient, SquareEnvironment } from 'square';

const isSandbox = process.env.SQUARE_ENV !== 'production';

export const squareClient = new SquareClient({
  token: isSandbox
    ? process.env.SQUARE_SANDBOX_ACCESS_TOKEN
    : process.env.SQUARE_ACCESS_TOKEN,
  environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
});

export const squareConfig = {
  isSandbox,
  applicationId: isSandbox
    ? process.env.SQUARE_SANDBOX_APPLICATION_ID
    : process.env.SQUARE_APPLICATION_ID,
  locationId: isSandbox
    ? process.env.SQUARE_SANDBOX_LOCATION_ID
    : process.env.SQUARE_LOCATION_ID,
};
