import type { CalculatorInputs, DailyData } from '../types';

export function calculateProjection(inputs: CalculatorInputs) {
  const { initialInvestment, monthlyContribution, years, annualReturn } = inputs;
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;

  let total = initialInvestment;
  const dataPoints: { year: number; total: number; principal: number }[] = [];

  const annualContribution = monthlyContribution * 12;
  let totalPrincipal = initialInvestment;

  for (let y = 0; y <= years; y++) {
    dataPoints.push({
      year: y,
      total: Math.round(total),
      principal: Math.round(totalPrincipal),
    });
    if (y < years) {
      for (let m = 0; m < 12; m++) {
        total = total * (1 + monthlyRate) + monthlyContribution;
        totalPrincipal += monthlyContribution;
      }
    }
  }

  const totalInvested = initialInvestment + annualContribution * years;
  const totalGains = Math.round(total) - totalInvested;
  const returnMultiple = totalInvested > 0 ? Math.round(total) / totalInvested : 0;

  return {
    dataPoints,
    annualContribution,
    totalInvested,
    finalValue: Math.round(total),
    totalGains,
    returnMultiple,
  };
}

export const HISTORICAL_RETURNS: { year: number; return: number }[] = [
  { year: 1928, return: 43.61 }, { year: 1929, return: -8.42 }, { year: 1930, return: -24.90 },
  { year: 1931, return: -43.34 }, { year: 1932, return: -8.19 }, { year: 1933, return: 53.99 },
  { year: 1934, return: -1.44 }, { year: 1935, return: 47.67 }, { year: 1936, return: 33.92 },
  { year: 1937, return: -35.03 }, { year: 1938, return: 31.12 }, { year: 1939, return: -0.41 },
  { year: 1940, return: -9.78 }, { year: 1941, return: -11.59 }, { year: 1942, return: 20.34 },
  { year: 1943, return: 25.90 }, { year: 1944, return: 19.75 }, { year: 1945, return: 36.44 },
  { year: 1946, return: -8.07 }, { year: 1947, return: 5.71 }, { year: 1948, return: 5.50 },
  { year: 1949, return: 18.79 }, { year: 1950, return: 31.71 }, { year: 1951, return: 24.02 },
  { year: 1952, return: 18.37 }, { year: 1953, return: -0.99 }, { year: 1954, return: 52.62 },
  { year: 1955, return: 31.56 }, { year: 1956, return: 6.56 }, { year: 1957, return: -10.78 },
  { year: 1958, return: 43.36 }, { year: 1959, return: 11.96 }, { year: 1960, return: 0.47 },
  { year: 1961, return: 26.89 }, { year: 1962, return: -8.73 }, { year: 1963, return: 22.80 },
  { year: 1964, return: 16.48 }, { year: 1965, return: 12.45 }, { year: 1966, return: -10.06 },
  { year: 1967, return: 23.98 }, { year: 1968, return: 11.06 }, { year: 1969, return: -8.50 },
  { year: 1970, return: 4.01 }, { year: 1971, return: 14.31 }, { year: 1972, return: 18.98 },
  { year: 1973, return: -14.66 }, { year: 1974, return: -26.47 }, { year: 1975, return: 37.20 },
  { year: 1976, return: 23.84 }, { year: 1977, return: -7.18 }, { year: 1978, return: 6.56 },
  { year: 1979, return: 18.44 }, { year: 1980, return: 32.50 }, { year: 1981, return: -4.92 },
  { year: 1982, return: 21.55 }, { year: 1983, return: 22.56 }, { year: 1984, return: 6.27 },
  { year: 1985, return: 31.73 }, { year: 1986, return: 18.67 }, { year: 1987, return: 5.25 },
  { year: 1988, return: 16.61 }, { year: 1989, return: 31.69 }, { year: 1990, return: -3.10 },
  { year: 1991, return: 30.47 }, { year: 1992, return: 7.62 }, { year: 1993, return: 10.08 },
  { year: 1994, return: 1.32 }, { year: 1995, return: 37.58 }, { year: 1996, return: 22.96 },
  { year: 1997, return: 33.36 }, { year: 1998, return: 28.58 }, { year: 1999, return: 21.04 },
  { year: 2000, return: -9.10 }, { year: 2001, return: -11.89 }, { year: 2002, return: -22.10 },
  { year: 2003, return: 28.68 }, { year: 2004, return: 10.88 }, { year: 2005, return: 4.91 },
  { year: 2006, return: 15.79 }, { year: 2007, return: 5.49 }, { year: 2008, return: -37.00 },
  { year: 2009, return: 26.46 }, { year: 2010, return: 15.06 }, { year: 2011, return: 2.11 },
  { year: 2012, return: 16.00 }, { year: 2013, return: 32.39 }, { year: 2014, return: 13.69 },
  { year: 2015, return: 1.38 }, { year: 2016, return: 11.96 }, { year: 2017, return: 21.83 },
  { year: 2018, return: -4.38 }, { year: 2019, return: 31.49 }, { year: 2020, return: 18.40 },
  { year: 2021, return: 28.71 }, { year: 2022, return: -18.11 }, { year: 2023, return: 26.29 },
  { year: 2024, return: 25.02 }, { year: 2025, return: 3.72 },
];

// SPY-equivalent year-end prices (S&P 500 index level / 10).
// SPY did not exist before 1993; pre-1993 values are the S&P 500 index
// (or S&P 90 pre-1957) scaled to SPY's approximate 1:10 ratio.
export const HISTORICAL_SPY_PRICES: { year: number; price: number }[] = [
  { year: 1928, price: 2.44 }, { year: 1929, price: 2.15 }, { year: 1930, price: 1.53 },
  { year: 1931, price: 0.81 }, { year: 1932, price: 0.69 }, { year: 1933, price: 1.01 },
  { year: 1934, price: 0.95 }, { year: 1935, price: 1.34 }, { year: 1936, price: 1.72 },
  { year: 1937, price: 1.06 }, { year: 1938, price: 1.32 }, { year: 1939, price: 1.25 },
  { year: 1940, price: 1.06 }, { year: 1941, price: 0.87 }, { year: 1942, price: 0.98 },
  { year: 1943, price: 1.17 }, { year: 1944, price: 1.33 }, { year: 1945, price: 1.74 },
  { year: 1946, price: 1.53 }, { year: 1947, price: 1.53 }, { year: 1948, price: 1.52 },
  { year: 1949, price: 1.68 }, { year: 1950, price: 2.04 }, { year: 1951, price: 2.38 },
  { year: 1952, price: 2.66 }, { year: 1953, price: 2.48 }, { year: 1954, price: 3.60 },
  { year: 1955, price: 4.55 }, { year: 1956, price: 4.67 }, { year: 1957, price: 4.00 },
  { year: 1958, price: 5.52 }, { year: 1959, price: 5.99 }, { year: 1960, price: 5.81 },
  { year: 1961, price: 7.16 }, { year: 1962, price: 6.31 }, { year: 1963, price: 7.50 },
  { year: 1964, price: 8.48 }, { year: 1965, price: 9.24 }, { year: 1966, price: 8.03 },
  { year: 1967, price: 9.65 }, { year: 1968, price: 10.39 },{ year: 1969, price: 9.21 },
  { year: 1970, price: 9.22 }, { year: 1971, price: 10.21 },{ year: 1972, price: 11.81 },
  { year: 1973, price: 9.76 }, { year: 1974, price: 6.86 }, { year: 1975, price: 9.02 },
  { year: 1976, price: 10.75 },{ year: 1977, price: 9.51 }, { year: 1978, price: 9.61 },
  { year: 1979, price: 10.79 },{ year: 1980, price: 13.58 },{ year: 1981, price: 12.26 },
  { year: 1982, price: 14.06 },{ year: 1983, price: 16.49 },{ year: 1984, price: 16.72 },
  { year: 1985, price: 21.13 },{ year: 1986, price: 24.22 },{ year: 1987, price: 24.71 },
  { year: 1988, price: 27.77 },{ year: 1989, price: 35.34 },{ year: 1990, price: 33.02 },
  { year: 1991, price: 41.71 },{ year: 1992, price: 43.57 },{ year: 1993, price: 46.65 },
  { year: 1994, price: 45.93 },{ year: 1995, price: 61.59 },{ year: 1996, price: 74.07 },
  { year: 1997, price: 97.04 },{ year: 1998, price: 122.92 },{ year: 1999, price: 146.93 },
  { year: 2000, price: 132.03 },{ year: 2001, price: 114.81 },{ year: 2002, price: 87.98 },
  { year: 2003, price: 111.19 },{ year: 2004, price: 121.19 },{ year: 2005, price: 124.83 },
  { year: 2006, price: 141.83 },{ year: 2007, price: 146.84 },{ year: 2008, price: 90.33 },
  { year: 2009, price: 111.51 },{ year: 2010, price: 125.76 },{ year: 2011, price: 125.76 },
  { year: 2012, price: 142.62 },{ year: 2013, price: 184.84 },{ year: 2014, price: 205.89 },
  { year: 2015, price: 204.39 },{ year: 2016, price: 223.88 },{ year: 2017, price: 267.36 },
  { year: 2018, price: 250.69 },{ year: 2019, price: 323.08 },{ year: 2020, price: 375.61 },
  { year: 2021, price: 476.62 },{ year: 2022, price: 383.95 },{ year: 2023, price: 476.98 },
  { year: 2024, price: 588.16 },
];

const SPY_START_PRICE = 1.77; // SPY-equivalent at end of 1927

export function getHistoricalMonthly(upToYear?: number): DailyData[] {
  const data: DailyData[] = [];
  let prevPrice = SPY_START_PRICE;

  for (const entry of HISTORICAL_SPY_PRICES) {
    if (upToYear && entry.year > upToYear) break;
    const priceDiff = entry.price - prevPrice;
    for (let m = 1; m <= 12; m++) {
      const price = prevPrice + priceDiff * (m / 12);
      data.push({ date: `${entry.year}-${String(m).padStart(2, '0')}-01`, close: Math.round(price * 100) / 100 });
    }
    prevPrice = entry.price;
  }
  return data;
}
