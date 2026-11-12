import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  ArcElement,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, DoughnutController, ArcElement, LinearScale, Tooltip);

const colors = {
  attending: '#496c61',
  declined: '#b88086',
  pending: '#d8b773',
  sent: '#754552',
  unsent: '#e4d1c7',
  groups: '#a56572',
  food: '#754552',
  foodClear: '#e4d1c7',
  busOutbound: '#496c61',
  busBoth: '#b88086',
  busReturn: '#d8b773',
  busMissing: '#b9a8a4',
  grid: '#ebddda',
  text: '#594b4d',
};

const staticOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
};

function values(canvas: HTMLCanvasElement): number[] {
  return (canvas.dataset.values ?? '').split(',').map((value) => Number(value) || 0);
}

export function renderAdminCharts() {
  const food = document.querySelector<HTMLCanvasElement>('[data-chart="food"]');
  if (food) {
    new Chart(food, {
      type: 'doughnut',
      data: {
        labels: ['Amb al·lèrgies indicades', 'Sense al·lèrgies indicades'],
        datasets: [{ data: values(food), backgroundColor: [colors.food, colors.foodClear], borderWidth: 0, hoverOffset: 3 }],
      },
      options: { ...staticOptions, cutout: '76%', plugins: { ...staticOptions.plugins, tooltip: { callbacks: { label: (item) => `${item.label}: ${item.formattedValue} persones` } } } },
    });
  }

  const bus = document.querySelector<HTMLCanvasElement>('[data-chart="bus"]');
  if (bus) {
    const [outbound, both, returnOnly, missing] = values(bus);
    new Chart(bus, {
      type: 'bar',
      data: {
        labels: ['Persones amb plaça'],
        datasets: [
          { label: 'Només anada', data: [outbound], backgroundColor: colors.busOutbound, borderSkipped: false, barThickness: 28 },
          { label: 'Anada i tornada', data: [both], backgroundColor: colors.busBoth, borderSkipped: false, barThickness: 28 },
          { label: 'Només tornada', data: [returnOnly], backgroundColor: colors.busReturn, borderSkipped: false, barThickness: 28 },
          { label: 'Sense trajecte', data: [missing], backgroundColor: colors.busMissing, borderSkipped: false, barThickness: 28 },
        ],
      },
      options: {
        ...staticOptions,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, beginAtZero: true, max: outbound + both + returnOnly + missing, display: false },
          y: { stacked: true, display: false },
        },
        plugins: { ...staticOptions.plugins, tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${item.formattedValue} persones` } } },
      },
    });
  }

  const response = document.querySelector<HTMLCanvasElement>('[data-chart="responses"]');
  if (response) {
    new Chart(response, {
      type: 'doughnut',
      data: {
        labels: ['Assistiran', 'No assistiran', 'Pendents'],
        datasets: [{ data: values(response), backgroundColor: [colors.attending, colors.declined, colors.pending], borderWidth: 0, hoverOffset: 4 }],
      },
      options: { ...staticOptions, cutout: '78%', plugins: { ...staticOptions.plugins, tooltip: { callbacks: { label: (item) => `${item.label}: ${item.formattedValue} persones` } } } },
    });
  }

  const delivery = document.querySelector<HTMLCanvasElement>('[data-chart="delivery"]');
  if (delivery) {
    const [sent, unsent] = values(delivery);
    new Chart(delivery, {
      type: 'bar',
      data: {
        labels: ['Invitacions'],
        datasets: [
          { label: 'Enviades', data: [sent], backgroundColor: colors.sent, borderRadius: 6, borderSkipped: false, barThickness: 26 },
          { label: 'Sense enviar', data: [unsent], backgroundColor: colors.unsent, borderRadius: 6, borderSkipped: false, barThickness: 26 },
        ],
      },
      options: {
        ...staticOptions,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, beginAtZero: true, max: sent + unsent, ticks: { precision: 0, color: colors.text }, grid: { color: colors.grid }, border: { display: false } },
          y: { stacked: true, display: false },
        },
        plugins: { ...staticOptions.plugins, tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${item.formattedValue}` } } },
      },
    });
  }

  const groups = document.querySelector<HTMLCanvasElement>('[data-chart="groups"]');
  if (groups) {
    const breakdown = JSON.parse(groups.dataset.groups ?? '[]') as { name: string; count: number }[];
    new Chart(groups, {
      type: 'bar',
      data: { labels: breakdown.map((group) => group.name), datasets: [{ label: 'Invitacions', data: breakdown.map((group) => group.count), backgroundColor: colors.groups, borderRadius: 6, borderSkipped: false, maxBarThickness: 24 }] },
      options: {
        ...staticOptions,
        indexAxis: 'y',
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0, color: colors.text }, grid: { color: colors.grid }, border: { display: false } },
          y: { ticks: { color: colors.text, font: { size: 12 } }, grid: { display: false }, border: { display: false } },
        },
        plugins: { ...staticOptions.plugins, tooltip: { callbacks: { label: (item) => `${item.formattedValue} invitacions` } } },
      },
    });
  }
}
