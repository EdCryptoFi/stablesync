// Fixes React 18 + @solana/wallet-adapter type incompatibility
import 'react';
declare module 'react' {
  interface ReactPortal {
    children?: ReactNode;
  }
}
