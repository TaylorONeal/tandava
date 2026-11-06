import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePortal } from "./handler.ts";
serve((request) => handlePortal(request));
