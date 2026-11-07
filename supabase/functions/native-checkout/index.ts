import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCheckout } from "../stripe-checkout/handler.ts";

// Separate entry point: a request body cannot disable native purchase rules.
serve((request) => handleCheckout(request, true));
