import axios from "axios";
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    DiscordProvider({
      clientId: JSON.parse(process.env.DISCORD).clientID,
      clientSecret: JSON.parse(process.env.DISCORD).clientSecret,
    }),
    {
      id: "minecraft",
      name: "Minecraft",
      clientId: "2896100471431234628",
      clientSecret: "ZjeQXkLJ.2896100471439623250.JlkY",
      type: "oauth",
      version: "2.0",
      scope: "profile",
      userinfo: {
        url: "",
        request: (context) => {
            return {
                uuid: context?.client?.uuid,
                mcName: context?.client?.mcName
            }
        }
      },
      token: {
        url: "https://mc-auth.com/oAuth2/token",
        async request(context) {
          const tokens = await axios
            .post("https://mc-auth.com/oAuth2/token", {
              ...context.params,
              grant_type: "authorization_code",
              client_id: "2896100471431234628",
              client_secret: "ZjeQXkLJ.2896100471439623250.JlkY",
              redirect_uri:
                (process.env.NEXTAUTH_URL ||
                "http://localhost:3000")
                + "/api/auth/callback/minecraft",
            })
          context.client.uuid = tokens.data.data.uuid
          context.client.mcName = tokens.data.data.profile.name
          return { tokens: tokens.data.access_token };
        },
      },
      authorization: {
        url: "https://mc-auth.com/oAuth2/authorize?response_type=code",
        params: { client_id: "2896100471431234628", scope: "profile" },
      },
      profile(profile) {
        console.log(profile)
        return {
            uuid: profile?.uuid,
            id: profile?.uuid,
            name: profile?.mcName
        }
      },
    },
  ],
  secret: process.env.JWT_SECRET
});
