import type { Metadata } from "next";
import { Providers } from "../components/shared/Providers";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { AutoConnect } from "thirdweb/react";
import { client } from "../consts/client";

export const metadata: Metadata = {
	title: "Marketplace",
	description: "",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<Providers>
					<AutoConnect client={client} />
					<NavBar />
					{children}
					<Footer />
				</Providers>
			</body>
		</html>
	);
}
