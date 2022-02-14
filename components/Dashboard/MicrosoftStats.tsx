import useSWR from 'swr';

const fetcher = async () => {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/coins/categories'
  );
  const data = await response.json();
  return data;
};

export default function MicrosoftStats() {
  const { data, error } = useSWR('token', fetcher);

  if (error) return <div>An error occured.</div>;
  if (!data) return <div>Loading...</div>;

  const filteredData = data.filter((coin: any) => coin.id === 'gaming');

  return (
    <div>
      {filteredData.map((coinCategory: any, idx: number) => (
        <div key={idx}>
          <h1 className="text-2xl">{coinCategory.name}</h1>
          <p>Market Cap: {coinCategory.market_cap}</p>
        </div>
      ))}
    </div>
  );
}
