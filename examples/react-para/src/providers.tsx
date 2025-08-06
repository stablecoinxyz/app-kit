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
          env: Environment.PROD, // Use BETA for development, PROD for production
        }}
        config={{
          appName: "SBC Para Example",
          disableAutoSessionKeepAlive: false,
        }}
        externalWalletConfig={{
          wallets: ["METAMASK"],
          walletConnect: { projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "" },
        }}
        paraModalConfig={{
          logo: "/sbc-logo.png",
          theme: { "borderRadius": "md" },
          oAuthMethods: [],
          disablePhoneLogin: true,
          authLayout: ["AUTH:FULL", "EXTERNAL:FULL"],
          recoverySecretStepEnabled: true,
          onRampTestMode: true
        }}
      >
        {children}
      </ParaProvider>
    </QueryClientProvider>
  );
} 