import { createThirdwebClient } from "thirdweb";
import { CLIENT_ID } from "./env";

export const client = createThirdwebClient({
  clientId: CLIENT_ID,
});