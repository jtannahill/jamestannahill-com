/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

type Env = {
  EMAIL: import('./lib/email').EmailBinding;
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
