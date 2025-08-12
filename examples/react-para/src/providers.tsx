import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Environment, ParaProvider } from "@getpara/react-sdk";
import "@getpara/react-sdk/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{
          apiKey: import.meta.env.VITE_PARA_API_KEY,
          env: Environment.PROD,
        }}
        config={{
          appName: "SBC Para Example",
          disableAutoSessionKeepAlive: false,
        }}
        // Focus on external wallets (MetaMask) for Base compatibility
        externalWalletConfig={{
          wallets: ["METAMASK", "COINBASE"],
          walletConnect: { projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "" },
        }}
        paraModalConfig={{
          logo: "/sbc-logo.png",
          theme: { "borderRadius": "md" },
          // Prioritize external wallets in the UI
          authLayout: ["EXTERNAL:FULL", "AUTH:FULL"],
          // Disable embedded wallet options for Base compatibility
          oAuthMethods: [],
          disablePhoneLogin: true,
          recoverySecretStepEnabled: false,
          onRampTestMode: false
        }}
      >
        {children}
      </ParaProvider>
    </QueryClientProvider>
  );
} 