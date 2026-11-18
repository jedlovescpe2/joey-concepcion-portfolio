/* Four looping illustrated panels for the "How I work" rows (no stock video: drawn in SVG/CSS). */

function Bar({ title }: { title: string }) {
  return (
    <div className="viz-bar">
      <i />
      <i />
      <i />
      <span>{title}</span>
    </div>
  );
}

function Uml() {
  const actors = [
    { x: 90, n: "Student" },
    { x: 290, n: "Enrolment" },
    { x: 490, n: "Registrar DB" },
  ];
  const msgs = [
    { y: 150, a: 0, b: 1, t: "submitForm()" },
    { y: 205, a: 1, b: 2, t: "validate(id)" },
    { y: 260, a: 2, b: 1, t: "record ✓" },
    { y: 315, a: 1, b: 0, t: "confirmation" },
  ];
  return (
    <div className="viz">
      <Bar title="sequence-diagram.uml" />
      <svg className="uml" viewBox="0 0 580 380" preserveAspectRatio="xMidYMid meet">
        {actors.map((a) => (
          <g key={a.n}>
            <rect className="box" x={a.x - 62} y={60} width={124} height={40} rx={8} />
            <text x={a.x} y={85} textAnchor="middle">
              {a.n}
            </text>
            <line className="life" x1={a.x} y1={100} x2={a.x} y2={360} />
          </g>
        ))}
        {msgs.map((m, i) => {
          const x1 = actors[m.a].x,
            x2 = actors[m.b].x,
            dir = x2 > x1 ? -1 : 1;
          return (
            <g key={i}>
              <path className="msg" style={{ animationDelay: `${i * 0.5}s` }} d={`M${x1} ${m.y}H${x2}m${dir * 9} -6l${-dir * 9} 6l${dir * 9} 6`} />
              <text className="lab" style={{ animationDelay: `${i * 0.5}s` }} x={(x1 + x2) / 2} y={m.y - 10} textAnchor="middle">
                {m.t}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Code() {
  const lines: [string, string][][] = [
    [["m", "<!-- HCP portal, accessible by default -->"]],
    [["t", "<nav "], ["k", "aria-label"], ["s", '="Main"'], ["t", ">"]],
    [["t", "  <a "], ["k", "href"], ["s", '="#therapy"'], ["t", ">"], ["", "Therapy areas"], ["t", "</a>"]],
    [["t", "</nav>"]],
    [["k", ".card"], ["", " { "], ["k", "display"], ["", ": grid; "], ["k", "gap"], ["s", ": 1rem"], ["", " }"]],
    [["k", "@media"], ["", " (min-width: 768px) { … }"]],
    [["k", "const"], ["", " market = "], ["s", "'SG'"], ["", ";"]],
    [["k", "await"], ["", " publish(page, { market });"]],
  ];
  return (
    <div className="viz">
      <Bar title="hcp-site / index.html" />
      <div className="code">
        {lines.map((l, i) => (
          <div key={i} style={{ animationDelay: `${i * 0.35}s` }}>
            {l.map(([c, t], k) => (
              <span key={k} className={c}>
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Term() {
  const lines: [string, string][] = [
    ["p", "$ ./run_eod.ksh --region APAC"],
    ["", "[02:58:11] EOD_BATCH  FR  ............ "],
    ["ok", "[03:01:42] FR  settlement     OK  (Sybase ASE 15)"],
    ["ok", "[03:04:09] JP  positions      OK"],
    ["wa", "[03:06:55] SG  valuations     RETRY 1/3"],
    ["ok", "[03:07:30] SG  valuations     OK"],
    ["ok", "[03:09:12] HK  reconciliation OK"],
    ["ok", "[03:10:47] DXB statements     OK"],
    ["p", "$ echo 'all regions green, back to sleep'"],
  ];
  return (
    <div className="viz">
      <Bar title="prod-support@eod — ksh" />
      <div className="term">
        {lines.map(([c, t], i) => (
          <div key={i} className={c} style={{ animationDelay: `${i * 0.45}s` }}>
            {t}
          </div>
        ))}
        <div className="cur" style={{ animationDelay: `${lines.length * 0.45}s` }}>
          ${" "}
        </div>
      </div>
    </div>
  );
}

function Chart() {
  const bars = [38, 52, 46, 64, 58, 76, 70, 92];
  return (
    <div className="viz">
      <Bar title="askan-channels — engagement" />
      <svg className="chart" viewBox="0 0 580 380" preserveAspectRatio="xMidYMid meet">
        <text x="30" y="80">EMAIL OPEN RATE · ASKAN</text>
        <text className="kpi" x="30" y="122">
          +18.4%
        </text>
        {bars.map((h, i) => (
          <rect key={i} className={`bar${i === bars.length - 1 ? " hi" : ""}`} style={{ animationDelay: `${i * 0.12}s` }} x={40 + i * 64} y={350 - h * 2.2} width={36} height={h * 2.2} rx={5} />
        ))}
        <path className="trend" d={bars.map((h, i) => `${i ? "L" : "M"}${58 + i * 64} ${330 - h * 2.2}`).join(" ")} />
        {["SG", "MY", "TH", "VN", "PH", "KR", "AU", "NZ"].map((m, i) => (
          <text key={m} x={58 + i * 64} y={372} textAnchor="middle">
            {m}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function Visual({ kind }: { kind: string }) {
  if (kind === "uml") return <Uml />;
  if (kind === "code") return <Code />;
  if (kind === "terminal") return <Term />;
  return <Chart />;
}
