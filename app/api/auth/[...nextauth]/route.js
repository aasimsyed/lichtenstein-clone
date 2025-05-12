import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Create the handler with correct provider instantiation
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signout',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
});

// Export the handler functions for API routes
export { handler as GET, handler as POST }; 