import DemoBankConfirmation from './DemoBankConfirmation';

type DemoBankSearchParams = {
  amount?: string | string[];
  content?: string | string[];
  reference?: string | string[];
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function DemoBankPaymentPage({
  searchParams,
}: {
  searchParams: Promise<DemoBankSearchParams>;
}) {
  const params = await searchParams;

  return (
    <DemoBankConfirmation
      amount={firstValue(params.amount)}
      content={firstValue(params.content)}
      reference={firstValue(params.reference)}
    />
  );
}
