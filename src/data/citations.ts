// phaseId は各ページの <div class="phase" id="..."> の id 属性と一致させること
// URL は DOI または archive.org などの永続URLを優先すること

export type CitationType = 'paper' | 'spec' | 'textbook' | 'official' | 'database';
export type PageId = 'physics' | 'chemistry' | 'biology' | 'math' | 'notes';

export interface Citation {
  id: string;
  page: PageId;
  phaseId: string;
  title: string;
  authors?: string;
  year?: number;
  url: string;
  type: CitationType;
  note?: string;
}

export const citations: readonly Citation[] = [
  // === physics / phase01: 目覚め・無重力の謎 ===
  {
    id: 'nist-gravity-constant',
    page: 'physics', phaseId: 'phase01',
    title: 'NIST: Newtonian constant of gravitation (G)',
    authors: 'CODATA 2022', year: 2022,
    url: 'https://physics.nist.gov/cgi-bin/cuu/Value?bg',
    type: 'official',
    note: 'G = 6.674×10⁻¹¹ という値の公式出典。物理の教科書の数値はここから来ている。',
  },
  {
    id: 'newton-principia-archive',
    page: 'physics', phaseId: 'phase01',
    title: 'Philosophiae Naturalis Principia Mathematica (英訳版, 1729)',
    authors: 'Isaac Newton', year: 1729,
    url: 'https://archive.org/details/newtonspmathema00newt',
    type: 'textbook',
    note: '万有引力を定式化した原典の英訳版。中身は難解だが「本物」を一度眺めてほしい。',
  },

  // === physics / phase02: 振り子で重力を測る ===
  {
    id: 'nist-standard-gravity',
    page: 'physics', phaseId: 'phase02',
    title: 'NIST: Standard acceleration of gravity (gn)',
    authors: 'CODATA 2022', year: 2022,
    url: 'https://physics.nist.gov/cgi-bin/cuu/Value?gn',
    type: 'official',
    note: '振り子の公式 T=2π√(L/g) に出てくる g = 9.80665 m/s² の公式定義値。',
  },

  // === physics / phase03: 人工重力と遠心力 ===
  {
    id: 'nasa-artificial-gravity-hrp',
    page: 'physics', phaseId: 'phase03',
    title: 'Human Research Program: Artificial Gravity',
    authors: 'NASA Human Research Program',
    url: 'https://humanresearchroadmap.nasa.gov/risks/risk.aspx?i=112',
    type: 'official',
    note: 'NASAが研究中の「本物の」人工重力の課題一覧。遠心力による宇宙酔いなど現実の問題を扱っている。',
  },

  // === physics / phase04: アストロファージ ===
  {
    id: 'nist-stefan-boltzmann',
    page: 'physics', phaseId: 'phase04',
    title: 'NIST: Stefan-Boltzmann constant (σ)',
    authors: 'CODATA 2022', year: 2022,
    url: 'https://physics.nist.gov/cgi-bin/cuu/Value?sigma',
    type: 'official',
    note: '太陽の放射エネルギーを計算するステファン=ボルツマン定数の公式値。',
  },

  // === physics / phase07: 光の圧力とソーラーセイル ===
  {
    id: 'maxwell-em-1865',
    page: 'physics', phaseId: 'phase07',
    title: 'A Dynamical Theory of the Electromagnetic Field (1865)',
    authors: 'James Clerk Maxwell', year: 1865,
    url: 'https://doi.org/10.1098/rstl.1865.0008',
    type: 'paper',
    note: '光が「圧力」を持つことを数学的に示したマクスウェルの論文。ソーラーセイルの理論的根拠。',
  },
  {
    id: 'jaxa-ikaros-mission',
    page: 'physics', phaseId: 'phase07',
    title: 'IKAROS ソーラーセイル実証機',
    authors: 'JAXA', year: 2010,
    url: 'https://www.isas.jaxa.jp/missions/spacecraft/current/ikaros.html',
    type: 'official',
    note: '2010年に世界で初めて宇宙でソーラーセイルによる加速に成功した日本の探査機の公式ページ。',
  },

  // === chemistry / chem01: アストロファージの元素組成 ===
  {
    id: 'iupac-periodic-table',
    page: 'chemistry', phaseId: 'chem01',
    title: 'IUPAC: Periodic Table of Elements',
    authors: 'IUPAC',
    url: 'https://iupac.org/what-we-do/periodic-table-of-elements/',
    type: 'official',
    note: '化学の国際機関 IUPAC が管理する公式の元素周期表。元素記号・原子量の国際基準値の出典。',
  },

  // === chemistry / chem02: ペトロヴァ周波数——アストロファージが放つ光 ===
  {
    id: 'nist-atomic-spectra-db',
    page: 'chemistry', phaseId: 'chem02',
    title: 'NIST Atomic Spectra Database',
    authors: 'NIST',
    url: 'https://physics.nist.gov/PhysRefData/ASD/lines_form.html',
    type: 'database',
    note: '元素が放出・吸収する光の波長を検索できるデータベース。「固有の色」の根拠となる実測値を確認できる。',
  },

  // === chemistry / chem03: 宇宙船の空気管理——気体の化学 ===
  {
    id: 'nist-chemistry-webbook',
    page: 'chemistry', phaseId: 'chem03',
    title: 'NIST Chemistry WebBook',
    authors: 'NIST',
    url: 'https://webbook.nist.gov/chemistry/',
    type: 'database',
    note: 'CO₂・O₂・N₂など各気体の物性データを調べられる。宇宙船の気体管理に出てくる数値の出典。',
  },

  // === biology / bio01: アストロファージの細胞生物学 ===
  {
    id: 'ncbi-molecular-biology-cell',
    page: 'biology', phaseId: 'bio01',
    title: 'Molecular Biology of the Cell (NCBI Bookshelf)',
    authors: 'Alberts et al.', year: 2002,
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK21054/',
    type: 'textbook',
    note: '生物学の定番教科書が NIH で全文公開されている。細胞の基本構造の章から読み始めると良い。',
  },

  // === biology / bio04: 極限環境生物——「ありえない場所」に生きる生命 ===
  {
    id: 'nasa-astrobiology-extremophiles',
    page: 'biology', phaseId: 'bio04',
    title: 'Extremophiles (NASA Astrobiology)',
    authors: 'NASA Astrobiology',
    url: 'https://astrobiology.nasa.gov/research/astrobiology-at-nasa/extremophiles/',
    type: 'official',
    note: 'NASAの宇宙生物学部門による極限環境生物の解説。どんな環境に生命が存在できるかを網羅している。',
  },

  // === math / math02: 対数スケール——宇宙的な数を扱う道具 ===
  {
    id: 'napier-logarithms-1614',
    page: 'math', phaseId: 'math02',
    title: 'Mirifici Logarithmorum Canonis Descriptio (1614)',
    authors: 'John Napier', year: 1614,
    url: 'https://archive.org/details/mirificilogarith00napi',
    type: 'textbook',
    note: '対数を発明したネイピアの原著（ラテン語）。400年前の数学革命を実感できる一冊。',
  },

  // === math / math03: 軌道計算とホーマン遷移 ===
  {
    id: 'jpl-basics-space-flight',
    page: 'math', phaseId: 'math03',
    title: 'Basics of Space Flight (JPL)',
    authors: 'NASA Jet Propulsion Laboratory',
    url: 'https://www2.jpl.nasa.gov/basics/',
    type: 'official',
    note: 'JPLが公開している宇宙飛行の基礎教材。軌道の種類・ホーマン遷移の計算が解説されている（英語）。',
  },

  // === notes / note02: メートルの定義変遷 ===
  {
    id: 'bipm-si-brochure-9',
    page: 'notes', phaseId: 'note02',
    title: 'The International System of Units — SI Brochure (9th ed.)',
    authors: 'BIPM', year: 2019,
    url: 'https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-EN.pdf',
    type: 'spec',
    note: 'メートル・秒・キログラムなど全 SI 単位の公式定義書。「光速でメートルを定義する」根拠がここにある。',
  },

  // === notes / note03: 秒の定義変遷 ===
  {
    id: 'nist-definition-second',
    page: 'notes', phaseId: 'note03',
    title: 'NIST: Definition of the Second',
    authors: 'NIST',
    url: 'https://www.nist.gov/si-redefinition/second',
    type: 'official',
    note: 'セシウム原子時計による「1秒」の公式定義。9,192,631,770回という振動数の意味が分かる。',
  },
] as const;

export function getCitationsFor(page: PageId, phaseId: string): Citation[] {
  return citations.filter((c) => c.page === page && c.phaseId === phaseId);
}
