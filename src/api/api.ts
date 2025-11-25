import * as photoshop from "./photoshop"; 
import { uxp } from "../globals";
import * as uxpLib from "./uxp";

const hostName =
  uxp?.host?.name.toLowerCase().replace(/\s/g, "") || ("" as string);

type HostAPI = typeof photoshop;
let host: Partial<HostAPI> = {};

export type API = typeof uxpLib & HostAPI;

if (hostName.startsWith("photoshop")) host = photoshop;

export const api = { ...uxpLib, ...(host as HostAPI) };
