import { Constants } from "./database.types";
import type { Database } from "./database.types";

export type SignalStatus = Database["public"]["Enums"]["signal_status"];
export type SignalType = Database["public"]["Enums"]["signal_type"];

export const SIGNAL_STATUSES = Constants.public.Enums.signal_status;
export const SIGNAL_TYPES = Constants.public.Enums.signal_type;
