import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col space-y-8 bg-surface-container-low p-6 font-body text-sm font-medium">
        <Link className="flex items-center gap-3 rounded-lg px-1 py-1" href="/admin">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <h1 className="font-headline font-extrabold leading-tight text-on-surface">Admin Console</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">AI Data Management</p>
          </div>
        </Link>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-tertiary px-4 py-3 font-semibold text-white shadow-md transition-all active:scale-95">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Interview
        </button>

        <nav className="flex-grow space-y-1">
          <Link className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </Link>
          <Link className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant" href="#">
            <span className="material-symbols-outlined">forum</span>
            Interviews
          </Link>
          <Link className="flex items-center gap-3 rounded-md bg-surface-container-lowest px-4 py-3 font-semibold text-primary shadow-sm" href="#">
            <span className="material-symbols-outlined">psychology</span>
            AI Insights
          </Link>
          <Link className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant" href="#">
            <span className="material-symbols-outlined">database</span>
            Knowledge Base
          </Link>
          <Link className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-transform duration-200 hover:translate-x-1 hover:bg-surface-variant" href="#">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </Link>
        </nav>

        <div className="space-y-1 border-t border-outline-variant/20 pt-6">
          <Link className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-variant" href="#">
            <span className="material-symbols-outlined">help</span>
            Help Center
          </Link>
          <Link className="flex items-center gap-3 rounded-md px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-variant" href="#">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </Link>
        </div>
      </aside>

      <main className="ml-64 min-h-screen p-12">
        <header className="mb-12 flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface">Intelligence Hub</h2>
            <p className="font-body text-on-surface-variant">Manage RAG repositories and monitor candidate performance metrics.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex -space-x-3">
              <img alt="User" className="h-10 w-10 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0R1uc6L61a-3y4Il3-IvwYwbuPvAIrdA0C3CgWETA0zE20DgLGWp2QZ2YU45E9OMrMrtAJShwaQ_I-IH9NfQWgfF6HmCFY5QisBrd12rdv18BVgJQHbIo3LBZG1_ogn9q0QbO53kz3AMH2_Ic_B2gqryiDbL3oFCpBkf0GhPdgvq3UWz2omAOwm95y1H-SIA7Bm0KNL5O4m6zW7OmFwrwIT14sACnMy81nb-tfpAHewqFCkegNzoA4TbC-FQqb68Mf0ofDG_xEhLh" />
              <img alt="User" className="h-10 w-10 rounded-full border-2 border-surface object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBIVHE9Q05wU6G7ttS5FLvJhCSmVQK9abrNyydNLA4JCX1ATMYpzkU_If4m8Ws7Vh1zXkyeMkL9uXkq4J3MKseSyyHnw7HRGxwjFKgQ1SpKQ_JqF3KmcjGDRksAF06Xat7Y4Zsw7-DW-qev2A2sWVfg6DBRlNKixRLVzMeFa0og0WhxK80B2yaHBgYlG8U6AHGVtPPX97aN8uoREqX_5-_Ckp49AOTNNgIf9NysDBTtFFrA8TJ_tCsX7oYwM2Ndq-mTcojiamySxdh" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-primary-fixed text-xs font-bold text-primary">+12</div>
            </div>
          </div>
        </header>

        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="col-span-1 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <span className="material-symbols-outlined rounded-lg bg-primary-fixed p-2 text-primary">groups</span>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">+12%</span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Total Interviews</p>
            <h3 className="font-headline text-3xl font-bold text-on-surface">1,284</h3>
          </div>

          <div className="col-span-1 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <span className="material-symbols-outlined rounded-lg bg-tertiary-fixed p-2 text-tertiary">verified</span>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">+5%</span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Success Rate</p>
            <h3 className="font-headline text-3xl font-bold text-on-surface">68.2%</h3>
          </div>

          <div className="col-span-1 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <span className="material-symbols-outlined rounded-lg bg-secondary-fixed p-2 text-secondary">person_play</span>
              <span className="rounded bg-surface-container px-2 py-1 text-xs font-bold text-on-surface-variant">Stable</span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Active Users</p>
            <h3 className="font-headline text-3xl font-bold text-on-surface">412</h3>
          </div>

          <div className="relative col-span-1 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-tertiary p-8 text-white shadow-xl">
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="ai-pulse h-2 w-2 rounded-full bg-white" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">AI Processor</span>
              </div>
              <p className="text-sm font-medium opacity-90">Tokens Analyzed</p>
              <h3 className="font-headline text-3xl font-bold">4.8M</h3>
              <p className="mt-4 text-[10px] opacity-70">RAG Efficiency: High</p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-10">psychology</span>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h4 className="font-headline text-2xl font-bold">AI Knowledge Base (RAG)</h4>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-variant">
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  Upload Corpus
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-container">
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Entry
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="px-6 py-4">Source &amp; Intent</th>
                    <th className="px-6 py-4">Knowledge Excerpt</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  <tr className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">description</span>
                        <div>
                          <p className="text-sm font-semibold">Policy_HR_v2.pdf</p>
                          <p className="text-xs text-on-surface-variant">Interview Protocols</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-xs italic text-on-surface-variant">&ldquo;Candidates must be evaluated on 5 key competencies including technical agility and team cultural fit...&rdquo;</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">2h ago</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md p-2 transition-colors hover:bg-primary-fixed"><span className="material-symbols-outlined text-lg text-primary">edit</span></button>
                        <button className="rounded-md p-2 transition-colors hover:bg-error-container"><span className="material-symbols-outlined text-lg text-error">delete</span></button>
                      </div>
                    </td>
                  </tr>

                  <tr className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-tertiary">question_answer</span>
                        <div>
                          <p className="text-sm font-semibold">Technical_QA_List</p>
                          <p className="text-xs text-on-surface-variant">Manual Training</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-xs italic text-on-surface-variant">&ldquo;Q: Explain CAP theorem. A: Consistency, Availability, and Partition Tolerance...&rdquo;</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">Yesterday</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md p-2 transition-colors hover:bg-primary-fixed"><span className="material-symbols-outlined text-lg text-primary">edit</span></button>
                        <button className="rounded-md p-2 transition-colors hover:bg-error-container"><span className="material-symbols-outlined text-lg text-error">delete</span></button>
                      </div>
                    </td>
                  </tr>

                  <tr className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">link</span>
                        <div>
                          <p className="text-sm font-semibold">Wiki_Culture_Export</p>
                          <p className="text-xs text-on-surface-variant">Web Scraping</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="max-w-xs text-xs italic text-on-surface-variant">&ldquo;Our mission is to democratize intelligence through seamless HR automation...&rdquo;</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">Oct 24, 2024</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-md p-2 transition-colors hover:bg-primary-fixed"><span className="material-symbols-outlined text-lg text-primary">edit</span></button>
                        <button className="rounded-md p-2 transition-colors hover:bg-error-container"><span className="material-symbols-outlined text-lg text-error">delete</span></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="font-headline text-2xl font-bold">Analytics Breakdown</h4>
            <div className="space-y-8 rounded-xl bg-surface-container-low p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>NLP Accuracy</span>
                  <span className="text-primary">94%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-[94%] bg-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Knowledge Coverage</span>
                  <span className="text-tertiary">78%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-[78%] bg-tertiary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>User Sentiment</span>
                  <span className="text-secondary">88%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full w-[88%] bg-secondary" />
                </div>
              </div>

              <div className="mt-8 border-t border-outline-variant/30 pt-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Traffic Heatmap</p>
                <div className="grid h-32 grid-cols-7 gap-1">
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-container" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-container" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-container" />
                  <div className="rounded-sm bg-primary" />
                  <div className="rounded-sm bg-primary-fixed" />
                  <div className="rounded-sm bg-primary-fixed-dim" />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-on-surface-variant">
                  <span>Mon</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-tertiary/20 bg-tertiary/10 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">auto_fix_high</span>
                <h5 className="font-bold text-tertiary">AI Suggestions</h5>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant">Consider updating the Conflict Resolution training set. Recent interviews show a 15% increase in related candidate queries.</p>
            </div>
          </section>
        </div>
      </main>

      <footer className="ml-64 w-full border-t border-outline-variant/20 bg-surface py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-12 md:flex-row">
          <div className="flex items-center gap-4">
            <span className="font-headline text-lg font-bold text-on-surface">Curator AI</span>
            <span className="text-xs text-on-surface-variant">© 2024 Curator AI Platform. Editorial Intelligence for HR.</span>
          </div>
          <div className="flex gap-8">
            <Link className="text-xs text-on-surface-variant hover:underline" href="#">Privacy Policy</Link>
            <Link className="text-xs text-on-surface-variant hover:underline" href="#">Terms of Service</Link>
            <Link className="text-xs text-on-surface-variant hover:underline" href="#">Cookie Policy</Link>
            <Link className="text-xs text-on-surface-variant hover:underline" href="#">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
