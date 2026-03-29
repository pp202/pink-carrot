import { consumeConnectionRequest } from "@/backend/user";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    requestId: string;
  }>;
};

const ConnectController = async ({ params }: Props) => {
  const { requestId } = await params;
  const result = await consumeConnectionRequest(requestId);

  if (result.status === "connected") {
    const alias = encodeURIComponent(result.alias);
    redirect(`/chestpals?notice=connected&alias=${alias}`);
  }

  if (result.status === "already-connected") {
    const alias = encodeURIComponent(result.alias);
    redirect(`/chestpals?notice=already-connected&alias=${alias}`);
  }

  if (result.status === "owner-active") {
    redirect(`/chestpals?notice=owner-active&minutes=${result.remainingMinutes}`);
  }

  redirect("/chestpals?notice=expired");
};

export default ConnectController;
