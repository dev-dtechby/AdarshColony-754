import EditVoucher from "./components/EditVoucher";

interface PageProps {
  params: {
    voucherId: string;
  };
}

export default function EditVoucherPage({ params }: PageProps) {
  const { voucherId } = params;

  if (!voucherId) {
    return (
      <div className="p-6 text-muted-foreground">
        Voucher ID not found
      </div>
    );
  }

  return <EditVoucher voucherId={voucherId} />;
}
