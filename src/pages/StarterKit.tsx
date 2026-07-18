import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Download, Pencil, RotateCcw } from "lucide-react";

type Emirate = "dubai" | "abu-dhabi" | "sharjah";
type VisaType = "employment" | "freelance" | "golden" | "family";
type Housing = "rent" | "own";

interface Answers {
  name: string;
  emirate: Emirate | "";
  visa: VisaType | "";
  housing: Housing | "";
  driving: boolean;
}

const STORAGE_KEY = "fempower_starter_kit_answers_v1";

const emirateLabel: Record<Emirate, string> = {
  dubai: "Dubai",
  "abu-dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
};

const visaLabel: Record<VisaType, string> = {
  employment: "Employment visa",
  freelance: "Freelance / self-sponsored visa",
  golden: "Golden Visa",
  family: "Family / dependent visa",
};

interface Source {
  label: string;
  url: string;
}

interface ChecklistItem {
  timing: string;
  title: string;
  bullets: string[];
  sources: Source[];
}

function buildChecklist(a: Answers): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // 1. SIM
  const simBullets = [
    "Buy a prepaid SIM from Etisalat (e&) or du at the airport or any branch. Passport is enough — no Emirates ID needed yet.",
    "Registration requires your original passport or Emirates ID in person, not a photo or copy.",
    "Once your Emirates ID is ready, switch to postpaid for better rates.",
  ];
  if (a.visa === "freelance" || a.visa === "golden") {
    simBullets.push("For postpaid on a freelance or Golden Visa, banks/telcos may ask for a bank statement instead of a salary certificate.");
  }
  items.push({
    timing: "Day 1",
    title: "Get a SIM card",
    bullets: simBullets,
    sources: [{ label: "TDRA — SIM registration rules", url: "https://tdra.gov.ae/en/tdra-initiatives/registration-for-mobile-consumers" }],
  });

  // 2. Emirates ID
  items.push({
    timing: "Week 1",
    title: "Apply for your Emirates ID",
    bullets: [
      "Your residence visa must be stamped/issued first.",
      "Complete a medical fitness test, then apply through the ICP app or website.",
      "Book your biometrics appointment (mandatory for anyone 15+).",
      "Processing takes about 5-10 working days. Fees: AED 200 (1-year), AED 300 (2-year), AED 400 (3-year) — includes an AED 100 service charge.",
      "Keep your application receipt — most banks and utility providers accept it before the physical card arrives.",
    ],
    sources: [
      { label: "ICP — New Identity Card Issuance", url: "https://icp.gov.ae/en/services-details/?serviceid=64afe3c1035448005bd52e5a" },
      { label: "u.ae — Emirates ID overview", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id" },
    ],
  });

  // 3. Bank
  const bankBullets = [
    "You'll need a valid residence visa plus your Emirates ID (or the application receipt).",
  ];
  if (a.visa === "employment") {
    bankBullets.push("Employment visa: bring a salary certificate or employer letter.");
  } else if (a.visa === "freelance") {
    bankBullets.push("Freelance / self-sponsored: bring your trade licence and incorporation documents instead of a salary certificate.");
  } else if (a.visa === "golden") {
    bankBullets.push("Golden Visa: bring proof of your visa and income source — onboarding is generally simpler.");
  } else if (a.visa === "family") {
    bankBullets.push("Family / dependent: bring your sponsor's Emirates ID and visa copy alongside your own documents.");
  }
  bankBullets.push(
    "Standard accounts usually need a minimum salary of ~AED 5,000/month.",
    "If you're not paid yet, a fully digital account with no minimum salary (e.g. Mashreq Neo) is the easiest first account.",
    "Approval typically takes anywhere from a few hours to a few days.",
  );
  items.push({
    timing: "Week 1-2",
    title: "Open a bank account",
    bullets: bankBullets,
    sources: [
      { label: "u.ae — Opening a bank account", url: "https://u.ae/en/information-and-services/finance-and-investment/banking-in-uae/opening-a-bank-account" },
      { label: "Central Bank of the UAE — licensing & regulation", url: "https://www.centralbank.ae/en/licensing/" },
    ],
  });

  // 4. Utility (per emirate)
  if (a.emirate === "dubai") {
    const bullets: string[] = [];
    if (a.housing === "rent") {
      bullets.push("Register your Ejari first — DEWA needs the Ejari number to activate the account.");
    } else {
      bullets.push("As an owner, use your title deed instead of an Ejari.");
    }
    bullets.push(
      "Apply online or via the DEWA Smart App with your Emirates ID, passport, and Ejari or title deed.",
      "Refundable security deposit: AED 2,000 (apartment) or AED 4,000 (villa).",
      "Activates within 6-24 working hours of payment.",
    );
    items.push({
      timing: "Week 1-2",
      title: "Connect utilities with DEWA (Dubai)",
      bullets,
      sources: [{ label: "DEWA — Activation of Electricity/Water, Move-in", url: "https://www.dewa.gov.ae/en/consumer/supply-management/activation-of-electricity-water-move-in" }],
    });
  } else if (a.emirate === "abu-dhabi") {
    const bullets: string[] = [];
    if (a.housing === "rent") {
      bullets.push("If your tenancy is registered with Tawtheeq, the account is set up automatically under the tenancy contract name — no separate application needed.");
      bullets.push("Otherwise apply through the TAMM portal: Housing & Utilities → Electricity & Water → New Connection.");
    } else {
      bullets.push("As an owner, apply through the TAMM portal (Housing & Utilities → Electricity & Water → New Connection) and upload your title deed and Emirates ID.");
    }
    bullets.push(
      "Deposit: AED 1,000 (single-phase) or AED 2,500 (three-phase).",
      "TAMM auto-routes your account to ADDC (Abu Dhabi city) or AADC (Al Ain / Western Region).",
    );
    items.push({
      timing: "Week 1-2",
      title: "Connect utilities with TAQA Distribution (Abu Dhabi)",
      bullets,
      sources: [{ label: "ADDC / TAQA Distribution — Move-in", url: "https://www.addc.ae/en-us/residential/pages/moveinresidential.aspx" }],
    });
  } else if (a.emirate === "sharjah") {
    items.push({
      timing: "Week 1-2",
      title: "Connect utilities with SEWA (Sharjah)",
      bullets: [
        "Submit your tenancy contract (signed by owner and tenant), Emirates ID, and the property's last SEWA meter clearance certificate.",
        "Apply via the SEWA e-Services portal only — no offline/manual applications for new connections.",
        "Pay the security deposit (varies by property type).",
        "Final step: get your tenancy contract attested by Sharjah Municipality.",
      ],
      sources: [
        { label: "SEWA — official website", url: "https://www.sewa.gov.ae/" },
        { label: "SEWA e-Services portal", url: "https://eservices.sewa.gov.ae/" },
      ],
    });
  }

  // 5. Toll (only if driving)
  if (a.driving) {
    if (a.emirate === "dubai") {
      items.push({
        timing: "Once you have a car",
        title: "Register for Salik (Dubai toll)",
        bullets: [
          "Buy a windshield RFID tag: AED 100 (AED 50 tag + AED 50 starting credit).",
          "Register/activate within 10 working days of your first gate crossing.",
          "AED 4 normal / AED 6 peak (6-10am & 4-8pm Sat-Thu), charged automatically — no need to slow down.",
          "There are 9 Salik gates across Dubai.",
        ],
        sources: [{ label: "Salik — How it works", url: "https://www.salik.ae/en/about/how-it-works" }],
      });
    } else if (a.emirate === "abu-dhabi") {
      items.push({
        timing: "Once you have a car",
        title: "Register for Darb (Abu Dhabi toll)",
        bullets: [
          "Darb is plate-based — there's no physical sticker like Salik.",
          "Create a Darb account on the TAMM portal using your Emirates ID number and mobile number, then link your plate number and vehicle registration.",
          "Registration is AED 100 (AED 50 becomes your starting account credit).",
          "Peak charges: Mon-Sat 7-9am & 5-7pm, AED 4 per pass.",
        ],
        sources: [{ label: "TAMM — Darb Toll System Registration", url: "https://www.tamm.abudhabi/en/life-events/individual/DriveTransport/darb/AbuDhabiTollSystemRegistration" }],
      });
    } else if (a.emirate === "sharjah") {
      items.push({
        timing: "Once you have a car",
        title: "Toll registration in Sharjah",
        bullets: [
          "Good news: Sharjah has no toll system as of 2026 — nothing to register for driving within Sharjah itself.",
          "If you regularly drive into Dubai or Abu Dhabi, you'll still need Salik or Darb respectively for those roads.",
        ],
        sources: [{ label: "Salik — toll gate locations (Dubai)", url: "https://www.salik.ae/en/toll-gates" }],
      });
    }
  }

  // 6. Transport card
  if (a.emirate === "dubai") {
    items.push({
      timing: "Anytime",
      title: "Get a Nol card (Dubai public transport)",
      bullets: [
        "For almost everyone, the Silver card is the right choice: AED 25, valid 5 years, works on metro, tram, bus and paid parking.",
        "Buy at any metro/tram stop or convenience store — pre-loaded and ready immediately.",
        "Daily cap of AED 14 (free after that until midnight).",
        "No cash accepted anywhere on RTA transport.",
      ],
      sources: [{ label: "RTA — Choose your Nol card", url: "https://www.rta.ae/wps/portal/rta/ae/public-transport/nol/choose-nol" }],
    });
  } else if (a.emirate === "abu-dhabi") {
    items.push({
      timing: "Anytime",
      title: "Get a Hafilat card (Abu Dhabi public transport)",
      bullets: [
        "The anonymous card is free, pay-as-you-go, sold at bus stations, Lulu Hypermarket and SPAR branches.",
        "For long-term use, get the personalized card — bring your Emirates ID to a Customer Happiness office at a bus station or the airport.",
        "Weekly pass AED 30, monthly AED 80, annual AED 500 — cheaper than pay-as-you-go if you commute daily.",
      ],
      sources: [{ label: "Abu Dhabi Mobility — Hafilat Smart Cards", url: "https://admobility.gov.ae/en/pb-bus-service/hafilat-cards" }],
    });
  } else if (a.emirate === "sharjah") {
    items.push({
      timing: "Anytime",
      title: "Get a Sayer card (Sharjah public transport)",
      bullets: [
        "Buy the Sayer Blue card from any Mowasalat bus driver or at Al Jubail Bus Station.",
        "AED 50 (AED 45 credit) or AED 95 (AED 90 credit), with a one-time AED 5 card fee.",
        "AED 6/ride with Sayer vs AED 8 cash on most city routes.",
        "For daily commuters, the Grey subscription card gives unlimited rides for 30 days at AED 225.",
      ],
      sources: [{ label: "SRTA — Sayer Card", url: "https://www.srta.gov.ae/en-us/Transport-Sector/Sayer-Card.html" }],
    });
  }

  // 7. Health insurance
  const insBullets: string[] = [];
  if (a.visa === "employment") {
    insBullets.push("Your employer is legally required to insure you from day one — this is part of onboarding, not something to buy yourself.");
  } else if (a.visa === "family") {
    insBullets.push("Your sponsor (spouse or parent) is responsible for arranging your cover.");
  } else {
    insBullets.push("You are responsible for buying your own policy — this will not be arranged for you.");
  }
  if (a.emirate === "dubai") {
    insBullets.push("Dubai minimum: AED 150,000/year annual benefits, regulated by DHA.");
    insBullets.push("Without valid insurance, visa application/renewal is refused and uninsured months are fined AED 500 each.");
  } else if (a.emirate === "abu-dhabi") {
    insBullets.push("Abu Dhabi minimum: AED 250,000/year (the highest of the three), regulated by DoH via the Daman Basic Plan.");
    if (a.visa === "employment") {
      insBullets.push("On an employment visa, your employer must also cover your spouse and up to 3 children under 18 — not just you.");
    }
  } else if (a.emirate === "sharjah") {
    insBullets.push("Sharjah / Northern Emirates: regulated by MOHRE/MOHAP, minimum AED 150,000/year.");
    insBullets.push("A low-cost federal pool plan is available from AED 320/year (ages 1-64).");
    insBullets.push("Required since January 2025 before residency permit issuance/renewal.");
  }
  const insSources: Source[] =
    a.emirate === "dubai"
      ? [{ label: "Dubai Health Authority — Health Insurance Corporation", url: "https://dha.gov.ae/en/dubai-health-insurance-corporation" }]
      : a.emirate === "abu-dhabi"
      ? [
          { label: "Department of Health Abu Dhabi", url: "https://www.doh.gov.ae" },
          { label: "Daman — Abu Dhabi Basic Health Insurance Plan", url: "https://www.damanhealth.ae/products/abu-dhabi-government-health-plans/" },
        ]
      : [{ label: "MOHRE — Basic Health Insurance Scheme", url: "https://mohre.gov.ae/en/guidance-and-awareness-portal-new/the-basic-health-insurance-scheme" }];
  items.push({
    timing: "Week 2-3",
    title: "Sort out health insurance",
    bullets: insBullets,
    sources: insSources,
  });

  return items;
}

const StarterKit = () => {
  const [answers, setAnswers] = useState<Answers>({
    name: "",
    emirate: "",
    visa: "",
    housing: "",
    driving: false,
  });
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Answers;
        if (saved.emirate && saved.visa && saved.housing) {
          setAnswers(saved);
          setShowResults(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const canSubmit = answers.emirate && answers.visa && answers.housing;

  const checklist = useMemo(
    () => (showResults && canSubmit ? buildChecklist(answers) : []),
    [showResults, canSubmit, answers],
  );

  const handleBuild = () => {
    if (!canSubmit) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      /* ignore */
    }
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAnswers({
      name: "",
      emirate: "",
      visa: "",
      housing: "",
      driving: false,
    });
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          header, footer, nav, .no-print { display: none !important; }
          body { background: white !important; }
          .print-root { padding: 0 !important; }
          .print-root h1 { font-size: 18pt !important; margin-bottom: 4pt !important; }
          .print-root h2 { font-size: 12pt !important; }
          .print-root, .print-root p, .print-root li { font-size: 9pt !important; line-height: 1.3 !important; color: #000 !important; }
          .print-section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 6pt !important; padding: 6pt !important; border: 1px solid #ddd !important; box-shadow: none !important; background: white !important; }
          .print-source a { color: #333 !important; text-decoration: underline !important; }
        }
      `}</style>

      <div className="no-print">
        <Header />
      </div>

      <main className="pt-24 pb-20 min-h-screen">
        <div className="container max-w-3xl px-4">
          <div className="no-print mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>

          <div className="print-root">
            <header className="mb-8">
              <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-2">
                Newcomer Starter Kit
                {showResults && answers.name ? <span className="text-blush-dark"> · {answers.name}</span> : null}
              </h1>
              <p className="font-body text-muted-foreground">
                {showResults
                  ? "Your personalised UAE relocation checklist. Print or save as PDF."
                  : "Answer a few quick questions and we'll build a personalised, one-page UAE relocation checklist for you."}
              </p>
            </header>

            {!showResults ? (
              <Card className="no-print p-6 md:p-8 border-blush/40">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="name"
                      value={answers.name}
                      onChange={(e) => setAnswers({ ...answers, name: e.target.value })}
                      placeholder="For the top of your PDF"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Which emirate are you moving to?</Label>
                    <Select value={answers.emirate} onValueChange={(v) => setAnswers({ ...answers, emirate: v as Emirate })}>
                      <SelectTrigger><SelectValue placeholder="Choose an emirate" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dubai">Dubai</SelectItem>
                        <SelectItem value="abu-dhabi">Abu Dhabi</SelectItem>
                        <SelectItem value="sharjah">Sharjah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Visa type</Label>
                    <Select value={answers.visa} onValueChange={(v) => setAnswers({ ...answers, visa: v as VisaType })}>
                      <SelectTrigger><SelectValue placeholder="Choose your visa" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employment">Employment visa (sponsored by employer)</SelectItem>
                        <SelectItem value="freelance">Freelance / self-sponsored visa</SelectItem>
                        <SelectItem value="golden">Golden Visa</SelectItem>
                        <SelectItem value="family">Family / dependent visa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Are you renting or do you own your home?</Label>
                    <RadioGroup
                      value={answers.housing}
                      onValueChange={(v) => setAnswers({ ...answers, housing: v as Housing })}
                      className="flex gap-6"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="rent" id="rent" />
                        <span>Renting</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="own" id="own" />
                        <span>Own home</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label htmlFor="driving" className="text-base">Will you be driving in the UAE?</Label>
                      <p className="text-sm text-muted-foreground">We'll add toll registration if yes.</p>
                    </div>
                    <Switch
                      id="driving"
                      checked={answers.driving}
                      onCheckedChange={(v) => setAnswers({ ...answers, driving: v })}
                    />
                  </div>

                  <Button
                    onClick={handleBuild}
                    disabled={!canSubmit}
                    className="w-full bg-blush-dark hover:bg-blush-dark/90 text-primary-foreground"
                    size="lg"
                  >
                    Build my checklist
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="no-print flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
                  <Button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto bg-blush-dark hover:bg-blush-dark/90 text-primary-foreground"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button variant="outline" onClick={() => setShowResults(false)} className="w-full sm:w-auto">
                    <Pencil className="h-4 w-4 mr-2" /> Edit answers
                  </Button>
                  <Button variant="ghost" onClick={handleClear} className="w-full sm:w-auto text-muted-foreground hover:text-destructive">
                    <RotateCcw className="h-4 w-4 mr-2" /> Clear my saved answers
                  </Button>
                </div>

                <div className="no-print mb-4 text-sm text-muted-foreground">
                  Personalised for {answers.emirate && emirateLabel[answers.emirate as Emirate]}
                  {answers.visa && ` · ${visaLabel[answers.visa as VisaType]}`}
                  {answers.housing && ` · ${answers.housing === "rent" ? "Renting" : "Own home"}`}
                  {answers.driving && ` · Driving`}
                </div>

                <ol className="space-y-4">
                  {checklist.map((item, i) => (
                    <li key={i} className="print-section">
                      <Card className="p-5 md:p-6 border-blush/40">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="inline-flex items-center justify-center min-w-7 h-7 rounded-full bg-blush-dark text-primary-foreground text-xs font-medium">
                            {i + 1}
                          </span>
                          <div>
                            <div className="text-xs uppercase tracking-widest text-blush-dark font-medium mb-1">
                              {item.timing}
                            </div>
                            <h2 className="font-heading text-xl text-foreground">{item.title}</h2>
                          </div>
                        </div>
                        <ul className="space-y-1.5 font-body text-sm text-foreground/90 ml-10 list-disc list-outside">
                          {item.bullets.map((b, j) => (
                            <li key={j}>{b}</li>
                          ))}
                        </ul>
                        <div className="ml-10 mt-3 space-y-1 print-source">
                          {item.sources.map((s, j) => (
                            <a
                              key={j}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blush-dark hover:underline mr-3"
                            >
                              {s.label} <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      </Card>
                    </li>
                  ))}
                </ol>

                <p className="mt-6 text-xs text-muted-foreground italic">
                  Fees and requirements are verified against official government sources as of July 2026 and can change. Always confirm against the linked source before you go.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
};

export default StarterKit;
