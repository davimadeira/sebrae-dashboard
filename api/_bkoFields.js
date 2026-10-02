// A linha 2200 contém as validações vigentes do cadastro na aba Preenchimento.
export async function getBkoFields(base, headers, columns, request) {
  const url = new URL(base.replace(/\/values\/$/, ''));
  url.searchParams.set('ranges', 'Preenchimento!A2200:V2200');
  url.searchParams.set('fields', 'sheets(data(rowData(values(dataValidation))))');
  const response = await request(url.toString(), { headers });
  if (!response.ok) throw Object.assign(new Error('Não foi possível carregar as opções da planilha. Tente novamente.'), { statusCode: 503 });
  const cells = (await response.json()).sheets?.[0]?.data?.[0]?.rowData?.[0]?.values || [];
  const ranges = new Map();
  return Promise.all(columns.map(async (name, index) => {
    const validation = cells[index]?.dataValidation;
    const condition = validation?.condition;
    let options = [];
    if (condition?.type === 'ONE_OF_LIST') options = condition.values.map(v => v.userEnteredValue);
    if (condition?.type === 'ONE_OF_RANGE') {
      const range = condition.values[0].userEnteredValue.replace(/^=/, '');
      if (!ranges.has(range)) ranges.set(range, (async () => {
        const result = await request(`${base}${encodeURIComponent(range)}`, { headers });
        if (!result.ok) throw Object.assign(new Error(`Não foi possível carregar as opções de ${name}.`), { statusCode: 503 });
        return (await result.json()).values?.flat() || [];
      })());
      options = await ranges.get(range);
    }
    return { name, options: [...new Set(options.filter(Boolean))], strict: validation?.strict === true, type: name === 'Status Ticket' ? 'calculated' : /^Data /i.test(name) ? 'date' : /Observa|Controle Interno|Estratégia/i.test(name) ? 'textarea' : 'text' };
  }));
}
