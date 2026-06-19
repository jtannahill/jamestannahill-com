/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

type Env = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  TURNSTILE_SECRET_KEY: string;
};

declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
      cfContext: ExecutionContext;
    };
    country?: string;
    requiresConsent?: boolean;
  }
}
