// shared-table-styles.ts  — importer dans chaque page admin
export const darkTableCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }

  .dt-table-wrap {
    background: linear-gradient(145deg, #131f2e, #1a2a3f);
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid #1e3050;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: fadeUp 0.45s ease both;
  }
  .dt-table { width: 100%; border-collapse: collapse; }
  .dt-thead-tr { border-bottom: 1px solid #1e3050; background: rgba(0,0,0,0.2); }
  .dt-th {
    padding: 13px 18px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    color: #4a6080;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .dt-row { border-bottom: 1px solid #111d2c; transition: background 0.15s; cursor: default; }
  .dt-row:last-child { border-bottom: none; }
  .dt-row:hover { background: rgba(255,255,255,0.025) !important; }
  .dt-td { padding: 13px 18px; font-size: 13.5px; font-family: 'DM Sans', sans-serif; }
  .dt-empty { padding: 4rem; text-align: center; color: #4a6080; font-family: 'DM Sans', sans-serif; font-size: 14px; }

  .dt-search {
    padding: 10px 16px;
    background: #131f2e;
    border: 1px solid #1e3050;
    border-radius: 12px;
    font-size: 13.5px;
    color: #c8d8f0;
    outline: none;
    width: 240px;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
  }
  .dt-search::placeholder { color: #4a6080; }
  .dt-search:focus { border-color: #2a4060; }

  .dt-skeleton {
    background: linear-gradient(90deg, #131f2e 25%, #1e2d40 50%, #131f2e 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
    display: inline-block;
  }
`;