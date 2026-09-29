"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Volume2,
  Pause,
  Play,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Shield,
  Sparkles,
  Users,
  FileText,
  Award,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  Sliders,
  HelpCircle,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Layers,
  ArrowUp,
  Share2,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function DoheHomePage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);
  const [isMarqueePlaying, setIsMarqueePlaying] = useState(true);
  const [offeringsTab, setOfferingsTab] = useState<"schemes" | "vacancies">("schemes");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const handleToggle = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-dropdown-item")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Carousel auto-play
  useEffect(() => {
    if (!isCarouselPlaying) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6500);
    return () => clearInterval(timer);
  }, [isCarouselPlaying]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const slides = [
    {
      titleEn: "Digital On-Screen Evaluation System (ExamSetu AI)",
      titleHi: "डिजिटल ऑन-स्क्रीन मूल्यांकन प्रणाली (ExamSetu AI)",
      subtitleEn:
        "Empowering Higher Education in Madhya Pradesh with Next-Gen AI-Assisted, Tamper-Evident Answer Sheet Marking & Real-Time Moderation.",
      subtitleHi:
        "मध्य प्रदेश में उच्च शिक्षा परीक्षाओं के लिए अत्याधुनिक एआई-संवर्धित, छेड़छाड़-मुक्त उत्तरपुस्तिका मूल्यांकन एवं रीयल-टाइम मॉडरेशन मंच।",
      badgeEn: "Government of India & MPOnline Initiative",
      badgeHi: "भारत सरकार एवं एमपीऑनलाइन पहल",
      cta1En: "Examiner Portal",
      cta1Hi: "परीक्षक पोर्टल",
      cta1Link: "/examiner",
      cta2En: "Controller Dashboard",
      cta2Hi: "नियंत्रक डैशबोर्ड",
      cta2Link: "/controller/dashboard",
      stats: [
        { labelEn: "Scripts Evaluated", labelHi: "मूल्यांकित कॉपियां", val: "1.2M+" },
        { labelEn: "Avg Marking Speed", labelHi: "औसत गति", val: "600s" },
        { labelEn: "Cryptographic Audit", labelHi: "ऑडिट सुरक्षा", val: "Ed25519" },
      ],
      bgGrad: "from-[#2b0818] via-[#480e28] to-[#12030a]",
    },
    {
      titleEn: "Viksit Bharat @ 2047: Paperless & Rapid University Evaluation",
      titleHi: "विकसित भारत @ 2047: पेपरलेस एवं त्वरित विश्वविद्यालय परीक्षा मूल्यांकन",
      subtitleEn:
        "100% On-Screen Evaluation across 52 Regional Centers. Zero physical transport leaks, automated question segmentation, and tamper-proof SHA-256 hash chains.",
      subtitleHi:
        "52 क्षेत्रीय केंद्रों में 100% ऑन-स्क्रीन मूल्यांकन। सुरक्षित डिजिटल स्कैनिंग, स्वचालित प्रश्न विभाजन और सुरक्षित हैश चेन।",
      badgeEn: "National Education Policy (NEP) Compliant",
      badgeHi: "राष्ट्रीय शिक्षा नीति (एनईपी) समर्थित",
      cta1En: "Controller Hub",
      cta1Hi: "नियंत्रक हब",
      cta1Link: "/controller/dashboard",
      cta2En: "Admin Management",
      cta2Hi: "प्रशासन प्रबंधन",
      cta2Link: "/admin/exams",
      stats: [
        { labelEn: "Participating Univs", labelHi: "विश्वविद्यालय", val: "18+" },
        { labelEn: "Evaluation Centres", labelHi: "मूल्यांकन केंद्र", val: "52" },
        { labelEn: "Turnaround Reduction", labelHi: "समय की बचत", val: "85%" },
      ],
      bgGrad: "from-[#1b263b] via-[#223354] to-[#0d131f]",
    },
    {
      titleEn: "Multimodal AI Marking with Strict Human-in-the-Loop Governance",
      titleHi: "मल्टीमॉडल एआई मार्किंग एवं परीक्षक का पूर्ण मानवीय नियंत्रण",
      subtitleEn:
        "Gemini 2.5 Flash transcribes bilingual student handwriting. Groq Llama 3.3 suggests rubric-aligned marks. The appointed examiner retains 100% final authority.",
      subtitleHi:
        "जेमिनी विज़न मॉडल छात्र की हस्तलिपि पढ़ता है; ग्रोक एलएलएम रूब्रिक अनुसार अंक सुझाता है। अंतिम निर्णय केवल नियुक्त परीक्षक का होता है।",
      badgeEn: "AI + Human Synergy",
      badgeHi: "एआई + मानव तालमेल",
      cta1En: "Start Evaluating",
      cta1Hi: "मूल्यांकन शुरू करें",
      cta1Link: "/examiner",
      cta2En: "Audit Log Chain",
      cta2Hi: "ऑडिट लॉग चेन",
      cta2Link: "/admin/audit",
      stats: [
        { labelEn: "AI Accuracy Rate", labelHi: "एआई सटीकता दर", val: "99.4%" },
        { labelEn: "Human Validation", labelHi: "मानवीय पुष्टि", val: "100%" },
        { labelEn: "Zero Data Leak", labelHi: "डेटा सुरक्षा", val: "DPDP 2025" },
      ],
      bgGrad: "from-[#1c1033] via-[#321957] to-[#100821]",
    },
  ];

  const announcements = [
    {
      en: "Dept. of Higher Education releases Standard Guidelines for AI-Augmented Evaluation 2026-27.",
      hi: "उच्च शिक्षा विभाग ने एआई-संवर्धित मूल्यांकन 2026-27 के लिए मानक दिशानिर्देश जारी किए।",
    },
    {
      en: "State University Semester VI On-Screen Marking live across 52 regional evaluation centres.",
      hi: "राज्य विश्वविद्यालय सेमेस्टर VI ऑन-स्क्रीन मार्किंग 52 क्षेत्रीय केंद्रों में सक्रिय।",
    },
    {
      en: "AISHE Report 2023-2024: Record growth in higher education digital infrastructure adoption.",
      hi: "अखिल भारतीय उच्च शिक्षा सर्वेक्षण (AISHE) रिपोर्ट 2023-2024 जारी।",
    },
    {
      en: "Double-blind moderation protocol active for answer scripts with score variance greater than 10%.",
      hi: "10% से अधिक विचलन वाली उत्तर पुस्तिकाओं हेतु डबल-ब्लाइंड मॉडरेशन व्यवस्था लागू।",
    },
    {
      en: "All evaluation logs cryptographically sealed with Ed25519 digital signatures and SHA-256 chain.",
      hi: "सभी मूल्यांकन लॉग Ed25519 डिजिटल हस्ताक्षर और SHA-256 श्रृंखला से सुरक्षित हैं।",
    },
  ];

  const fontSizeClass =
    fontSize === "sm" ? "text-sm" : fontSize === "lg" ? "text-lg" : "text-base";

  return (
    <div className={`min-h-screen bg-[#fafbfc] text-[#1e293b] ${fontSizeClass} selection:bg-[#631438]/20 selection:text-[#631438]`}>
      {/* ───────────────────────────────────────────────────────────
          1. TOP UTILITY & GOVERNMENT LOGO HEADER BAR
      ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#e2e8f0] bg-white sticky top-0 z-50 shadow-xs">
        {/* Topmost micro-bar: Accessibility & Flag accent */}
        <div className="bg-[#f8f9fa] border-b border-[#e9ecef] px-4 py-1 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 text-[#475569]">
              <span className="font-medium text-[#631438]">
                {lang === "en" ? "Government of India" : "भारत सरकार"}
              </span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="hidden sm:inline">
                {lang === "en" ? "Ministry of Education" : "शिक्षा मंत्रालय"}
              </span>
              <span className="hidden md:inline text-gray-300">|</span>
              <span className="hidden md:inline font-semibold text-[#0f172a]">
                {lang === "en" ? "Department of Higher Education" : "उच्च शिक्षा विभाग"}
              </span>
            </div>

            {/* Accessibility & Language toggle */}
            <div className="flex items-center gap-3">
              <a
                href="#main-content"
                className="hidden md:inline text-xs text-[#475569] hover:text-[#631438] underline"
              >
                {lang === "en" ? "Skip to Main Content" : "मुख्य सामग्री पर जाएं"}
              </a>
              <div className="flex items-center border border-[#cbd5e1] rounded bg-white overflow-hidden text-xs">
                <button
                  onClick={() => setFontSize("sm")}
                  className={`px-2 py-0.5 font-bold hover:bg-[#f1f5f9] ${fontSize === "sm" ? "bg-[#631438] text-white" : "text-gray-700"}`}
                  title="Small Font"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize("md")}
                  className={`px-2 py-0.5 font-bold hover:bg-[#f1f5f9] border-x border-[#cbd5e1] ${fontSize === "md" ? "bg-[#631438] text-white" : "text-gray-700"}`}
                  title="Default Font"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize("lg")}
                  className={`px-2 py-0.5 font-bold hover:bg-[#f1f5f9] ${fontSize === "lg" ? "bg-[#631438] text-white" : "text-gray-700"}`}
                  title="Large Font"
                >
                  A+
                </button>
              </div>

              {/* Language Switcher */}
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="flex items-center gap-1 px-2.5 py-0.5 font-bold text-xs rounded border border-[#631438] text-[#631438] hover:bg-[#631438] hover:text-white transition-colors"
                title="Switch Language"
              >
                <span className="text-sm">अ</span> / A
                <span className="ml-1 text-[10px] opacity-80">
                  ({lang === "en" ? "हिंदी" : "English"})
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Logo & Search Bar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Official Emblem + Department Title */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Ashoka Stambh Emblem SVG */}
            <div className="shrink-0 flex items-center justify-center p-1 bg-amber-50/50 rounded border border-amber-200/50">
              <svg
                width="48"
                height="56"
                viewBox="0 0 48 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#1e293b]"
              >
                {/* Ashoka Lion Capital Graphic Vector */}
                <path
                  d="M24 2C18 2 15 5 15 9C15 11 16 13 18 14.5C15 16 13 19 13 22C13 25 15 27 17 28.5C15.5 30 14.5 32 14.5 35C14.5 38 17 40 20 41L20 44H14V46H34V44H28L28 41C31 40 33.5 38 33.5 35C33.5 32 32.5 30 31 28.5C33 27 35 25 35 22C35 19 33 16 30 14.5C32 13 33 11 33 9C33 5 30 2 24 2Z"
                  fill="#631438"
                  opacity="0.9"
                />
                <circle cx="24" cy="48" r="4" fill="#0f172a" />
                <path d="M12 52H36V54H12V52Z" fill="#631438" />
                <text
                  x="24"
                  y="51"
                  fontSize="4"
                  fill="#ffffff"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  सत्यमेव जयते
                </text>
              </svg>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-[#475569] font-medium leading-tight">
                {lang === "en" ? "Government of India" : "भारत सरकार"} •{" "}
                {lang === "en" ? "Ministry of Education" : "शिक्षा मंत्रालय"}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] leading-tight tracking-tight">
                {lang === "en" ? "Department of Higher Education" : "उच्च शिक्षा विभाग"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.2 rounded bg-[#631438] text-white">
                  ExamSetu AI
                </span>
                <span className="text-xs text-[#64748b] font-medium">
                  {lang === "en"
                    ? "MPOnline Digital On-Screen Evaluation System (DOSES)"
                    : "एमपीऑनलाइन डिजिटल ऑन-स्क्रीन मूल्यांकन प्रणाली"}
                </span>
              </div>
            </div>
          </div>

          {/* Search Box with Maroon Button */}
          <div className="w-full md:w-96 flex items-center">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "en"
                    ? "Search exams, schemes, guidelines..."
                    : "परीक्षाएं, योजनाएं, दिशानिर्देश खोजें..."
                }
                className="w-full pl-4 pr-12 py-2 rounded-full border border-[#cbd5e1] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#631438]/30 focus:border-[#631438] transition-all bg-white"
              />
              <button
                type="button"
                className="absolute right-1 top-1 bottom-1 px-3.5 rounded-full bg-[#631438] text-white flex items-center justify-center hover:bg-[#4d0f2b] transition-colors"
                title="Search"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Burgundy Navigation Bar */}
        <nav className="border-t border-[#e2e8f0] bg-white text-[#1e293b] relative z-40">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            {/* Desktop Navigation Links with Dropdowns */}
            <div className="hidden md:flex items-center font-semibold text-sm">
              <Link
                href="/"
                className="px-4 py-3 text-[#631438] border-b-3 border-[#631438] font-bold flex items-center gap-1.5 bg-[#fcf5f8]"
              >
                {lang === "en" ? "Home" : "मुख्य पृष्ठ"}
              </Link>

              {/* Department Dropdown */}
              <div
                className="relative group nav-dropdown-item"
                onMouseEnter={() => handleMouseEnter("department")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  id="nav-dropdown-department-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle("department");
                  }}
                  className={`px-4 py-3 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeDropdown === "department"
                      ? "text-[#631438] bg-[#fcf5f8]"
                      : "hover:text-[#631438] hover:bg-[#fafafa]"
                  }`}
                  aria-expanded={activeDropdown === "department"}
                >
                  <span>{lang === "en" ? "Department" : "विभाग"}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "department" ? "rotate-180 text-[#631438]" : "text-gray-400 group-hover:rotate-180"
                    }`}
                  />
                </button>

                <div
                  className={`absolute left-0 top-full w-64 bg-white border border-[#cbd5e1] shadow-2xl rounded-b-xl py-2 z-50 transition-all ${
                    activeDropdown === "department" ? "block" : "hidden group-hover:block"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
                  <a
                    href="#about"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    {lang === "en" ? "About DOHE & ExamSetu" : "विभाग एवं एग्जामसेतु परिचय"}
                  </a>
                  <a
                    href="#leadership"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    {lang === "en" ? "Leadership & Dignitaries" : "नेतृत्व एवं पदाधिकारी"}
                  </a>
                  <a
                    href="#bureaus"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    {lang === "en" ? "Evaluation Bureaus" : "मूल्यांकन ब्यूरो एवं केंद्र"}
                  </a>
                  <a
                    href="#stats"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    {lang === "en" ? "Performance Metrics" : "प्रगति एवं आंकड़े"}
                  </a>
                </div>
              </div>

              {/* Offerings Dropdown */}
              <div
                className="relative group nav-dropdown-item"
                onMouseEnter={() => handleMouseEnter("offerings")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  id="nav-dropdown-offerings-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle("offerings");
                  }}
                  className={`px-4 py-3 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeDropdown === "offerings"
                      ? "text-[#631438] bg-[#fcf5f8]"
                      : "hover:text-[#631438] hover:bg-[#fafafa]"
                  }`}
                  aria-expanded={activeDropdown === "offerings"}
                >
                  <span>{lang === "en" ? "Offerings" : "सेवाएं"}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "offerings" ? "rotate-180 text-[#631438]" : "text-gray-400 group-hover:rotate-180"
                    }`}
                  />
                </button>

                <div
                  className={`absolute left-0 top-full w-72 bg-white border border-[#cbd5e1] shadow-2xl rounded-b-xl py-2 z-50 transition-all ${
                    activeDropdown === "offerings" ? "block" : "hidden group-hover:block"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
                  <Link
                    href="/examiner"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    <div className="font-bold text-[#0f172a] hover:text-[#631438]">
                      {lang === "en" ? "On-Screen Marking (OSM)" : "ऑन-स्क्रीन मार्किंग प्रणाली"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === "en" ? "AI-assisted digital evaluation" : "एआई संवर्धित डिजिटल मूल्यांकन"}
                    </div>
                  </Link>
                  <Link
                    href="/controller/dashboard"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors border-t border-slate-100"
                  >
                    <div className="font-bold text-[#0f172a] hover:text-[#631438]">
                      {lang === "en" ? "Double-Blind Moderation" : "डबल-ब्लाइंड मॉडरेशन"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === "en" ? "Score discrepancy resolution" : "अंक विचलन समाधान"}
                    </div>
                  </Link>
                  <Link
                    href="/admin/audit"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors border-t border-slate-100"
                  >
                    <div className="font-bold text-[#0f172a] hover:text-[#631438]">
                      {lang === "en" ? "Ed25519 Cryptographic Audit" : "क्रिप्टोग्राफिक ऑडिट चेन"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === "en" ? "Tamper-evident verification" : "अपरिवर्तनीय डिजिटल मुहर"}
                    </div>
                  </Link>
                  <a
                    href="#offerings"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors border-t border-slate-100"
                  >
                    <div className="font-bold text-[#0f172a] hover:text-[#631438]">
                      {lang === "en" ? "RUSA & Central Schemes" : "रूसा एवं केंद्रीय योजनाएं"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === "en" ? "Higher education mandates" : "उच्च शिक्षा विकास योजनाएं"}
                    </div>
                  </a>
                </div>
              </div>

              {/* Documents Dropdown */}
              <div
                className="relative group nav-dropdown-item"
                onMouseEnter={() => handleMouseEnter("documents")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  id="nav-dropdown-documents-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle("documents");
                  }}
                  className={`px-4 py-3 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeDropdown === "documents"
                      ? "text-[#631438] bg-[#fcf5f8]"
                      : "hover:text-[#631438] hover:bg-[#fafafa]"
                  }`}
                  aria-expanded={activeDropdown === "documents"}
                >
                  <span>{lang === "en" ? "Documents" : "प्रलेख"}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "documents" ? "rotate-180 text-[#631438]" : "text-gray-400 group-hover:rotate-180"
                    }`}
                  />
                </button>

                <div
                  className={`absolute left-0 top-full w-64 bg-white border border-[#cbd5e1] shadow-2xl rounded-b-xl py-2 z-50 transition-all ${
                    activeDropdown === "documents" ? "block" : "hidden group-hover:block"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
                  <a
                    href="#offerings"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    {lang === "en" ? "Evaluation Guidelines 2026" : "मूल्यांकन मार्गदर्शिका 2026"}
                  </a>
                  <a
                    href="#offerings"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    {lang === "en" ? "AISHE Annual Report" : "अखिल भारतीय उच्च शिक्षा रिपोर्ट"}
                  </a>
                  <a
                    href="#offerings"
                    onClick={() => setActiveDropdown(null)}
                    className="block px-4 py-2.5 text-xs text-slate-700 hover:bg-[#fcf5f8] hover:text-[#631438] font-medium transition-colors"
                  >
                    {lang === "en" ? "SOP for Answer Script Digitize" : "उत्तरपुस्तिका डिजिटलीकरण एसओपी"}
                  </a>
                </div>
              </div>

              <a
                href="#multimedia"
                className="px-4 py-3 hover:text-[#631438] hover:bg-[#fafafa] transition-colors"
              >
                {lang === "en" ? "Media & Gallery" : "मीडिया एवं दीर्घा"}
              </a>
              <a
                href="#footer"
                className="px-4 py-3 hover:text-[#631438] hover:bg-[#fafafa] transition-colors"
              >
                {lang === "en" ? "Connect" : "संपर्क"}
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center py-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg border border-[#cbd5e1] text-[#631438] hover:bg-[#fcf5f8]"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Quick Action Role Buttons */}
            <div className="flex items-center gap-2 py-2 shrink-0">
              <Link
                href="/examiner"
                className="px-3 py-1.5 text-xs font-bold rounded-md bg-[#631438] text-white hover:bg-[#4a0d29] transition-all shadow-xs flex items-center gap-1.5"
              >
                <FileText size={13} />
                <span className="hidden sm:inline">{lang === "en" ? "Examiner Portal" : "परीक्षक पोर्टल"}</span>
                <span className="sm:hidden">Examiner</span>
              </Link>
              <Link
                href="/controller/dashboard"
                className="px-3 py-1.5 text-xs font-bold rounded-md bg-[#0f172a] text-white hover:bg-[#1e293b] transition-all shadow-xs flex items-center gap-1.5"
              >
                <Sliders size={13} />
                <span className="hidden sm:inline">{lang === "en" ? "Controller Hub" : "नियंत्रक हब"}</span>
                <span className="sm:hidden">Controller</span>
              </Link>
              <Link
                href="/admin/exams"
                className="hidden lg:flex px-3 py-1.5 text-xs font-bold rounded-md border border-[#cbd5e1] text-[#334155] hover:bg-[#f8fafc] hover:border-[#631438] hover:text-[#631438] transition-all items-center gap-1.5"
              >
                <Shield size={13} />
                <span>{lang === "en" ? "Admin Console" : "प्रशासन"}</span>
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-bold rounded-md border border-[#631438] text-[#631438] hover:bg-[#631438] hover:text-white transition-all"
              >
                {lang === "en" ? "Sign In" : "लॉगिन"}
              </Link>
            </div>
          </div>

          {/* Mobile Collapsible Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#e2e8f0] bg-white px-4 py-3 space-y-2 shadow-lg animate-in fade-in duration-150">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md font-bold text-[#631438] bg-[#fcf5f8]"
              >
                {lang === "en" ? "Home" : "मुख्य पृष्ठ"}
              </Link>

              {/* Mobile Department Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "m-dept" ? null : "m-dept")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md font-semibold text-slate-800 hover:bg-slate-50 text-sm"
                >
                  <span>{lang === "en" ? "Department" : "विभाग"}</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "m-dept" ? "rotate-180 text-[#631438]" : "text-gray-400"
                    }`}
                  />
                </button>
                {activeDropdown === "m-dept" && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-md text-xs">
                    <a
                      href="#about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "About DOHE & ExamSetu" : "विभाग एवं एग्जामसेतु परिचय"}
                    </a>
                    <a
                      href="#leadership"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "Leadership & Dignitaries" : "नेतृत्व एवं पदाधिकारी"}
                    </a>
                    <a
                      href="#bureaus"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "Evaluation Bureaus" : "मूल्यांकन ब्यूरो एवं केंद्र"}
                    </a>
                    <a
                      href="#stats"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "Performance Metrics" : "प्रगति एवं आंकड़े"}
                    </a>
                  </div>
                )}
              </div>

              {/* Mobile Offerings Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "m-offer" ? null : "m-offer")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md font-semibold text-slate-800 hover:bg-slate-50 text-sm"
                >
                  <span>{lang === "en" ? "Offerings" : "सेवाएं"}</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "m-offer" ? "rotate-180 text-[#631438]" : "text-gray-400"
                    }`}
                  />
                </button>
                {activeDropdown === "m-offer" && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-md text-xs">
                    <Link
                      href="/examiner"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "On-Screen Marking (OSM)" : "ऑन-स्क्रीन मार्किंग प्रणाली"}
                    </Link>
                    <Link
                      href="/controller/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "Double-Blind Moderation" : "डबल-ब्लाइंड मॉडरेशन"}
                    </Link>
                    <Link
                      href="/admin/audit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "Ed25519 Cryptographic Audit" : "क्रिप्टोग्राफिक ऑडिट चेन"}
                    </Link>
                    <a
                      href="#offerings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "RUSA & Central Schemes" : "रूसा एवं केंद्रीय योजनाएं"}
                    </a>
                  </div>
                )}
              </div>

              {/* Mobile Documents Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "m-docs" ? null : "m-docs")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md font-semibold text-slate-800 hover:bg-slate-50 text-sm"
                >
                  <span>{lang === "en" ? "Documents" : "प्रलेख"}</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "m-docs" ? "rotate-180 text-[#631438]" : "text-gray-400"
                    }`}
                  />
                </button>
                {activeDropdown === "m-docs" && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-md text-xs">
                    <a
                      href="#offerings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "Evaluation Guidelines 2026" : "मूल्यांकन मार्गदर्शिका 2026"}
                    </a>
                    <a
                      href="#offerings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "AISHE Annual Report" : "अखिल भारतीय उच्च शिक्षा रिपोर्ट"}
                    </a>
                    <a
                      href="#offerings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-slate-700 hover:text-[#631438]"
                    >
                      {lang === "en" ? "SOP for Answer Script Digitize" : "उत्तरपुस्तिका डिजिटलीकरण एसओपी"}
                    </a>
                  </div>
                )}
              </div>

              <a
                href="#multimedia"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md font-semibold text-slate-800 hover:bg-slate-50 text-sm"
              >
                {lang === "en" ? "Media & Gallery" : "मीडिया एवं दीर्घा"}
              </a>
              <a
                href="#footer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md font-semibold text-slate-800 hover:bg-slate-50 text-sm"
              >
                {lang === "en" ? "Connect" : "संपर्क"}
              </a>
            </div>
          )}
        </nav>
      </header>

      {/* ───────────────────────────────────────────────────────────
          2. HERO CAROUSEL / SLIDER BANNER (EXACT DOHE BANNER STYLE)
      ─────────────────────────────────────────────────────────── */}
      <section id="main-content" className="relative overflow-hidden bg-[#1e0712] text-white">
        <div className={`transition-all duration-700 bg-gradient-to-r ${slides[activeSlide].bgGrad} py-14 md:py-20 px-4`}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <Sparkles size={14} className="animate-pulse" />
                <span>{lang === "en" ? slides[activeSlide].badgeEn : slides[activeSlide].badgeHi}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                {lang === "en" ? slides[activeSlide].titleEn : slides[activeSlide].titleHi}
              </h2>

              <p className="text-base sm:text-lg text-slate-200/90 max-w-2xl leading-relaxed">
                {lang === "en" ? slides[activeSlide].subtitleEn : slides[activeSlide].subtitleHi}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={slides[activeSlide].cta1Link}
                  className="px-6 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
                >
                  {lang === "en" ? slides[activeSlide].cta1En : slides[activeSlide].cta1Hi}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href={slides[activeSlide].cta2Link}
                  className="px-6 py-3 rounded-lg font-bold text-sm bg-white/10 hover:bg-white/20 border border-white/25 text-white transition-all backdrop-blur-sm flex items-center gap-2"
                >
                  {lang === "en" ? slides[activeSlide].cta2En : slides[activeSlide].cta2Hi}
                  <ExternalLink size={14} />
                </Link>
              </div>

              {/* Live Stat Badges on Slider */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg">
                {slides[activeSlide].stats.map((stat, i) => (
                  <div key={i} className="bg-black/25 rounded-md p-2.5 border border-white/10 backdrop-blur-xs">
                    <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                      {stat.val}
                    </div>
                    <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">
                      {lang === "en" ? stat.labelEn : stat.labelHi}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Graphic Banner Card (Matching DOHE Quiz / Campaign banner) */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-6 text-center space-y-4 shadow-2xl">
                <div className="inline-block p-3 rounded-2xl bg-[#631438] text-white shadow-md">
                  <GraduationCap size={42} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase font-extrabold text-amber-300 tracking-wider">
                    {lang === "en" ? "Madhya Pradesh Higher Education" : "मध्य प्रदेश उच्च शिक्षा"}
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {lang === "en" ? "On-Screen Marking System" : "ऑन-स्क्रीन मार्किंग पोर्टल"}
                  </h3>
                  <p className="text-xs text-slate-200">
                    {lang === "en"
                      ? "AI-Assisted Evaluation • Human-in-the-Loop • Tamper-Proof Audit"
                      : "एआई-संवर्धित मूल्यांकन • मानवीय नियंत्रण • छेड़छाड़-मुक्त ऑडिट"}
                  </p>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-white/10 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{lang === "en" ? "Current Session:" : "वर्तमान सत्र:"}</span>
                    <span className="font-bold text-white">2026-2027 Even Sem</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{lang === "en" ? "Active Evaluation Centers:" : "सक्रिय केंद्र:"}</span>
                    <span className="font-bold text-amber-300">52 Centers</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{lang === "en" ? "AI Model Pipeline:" : "एआई मॉडल पाइपलाइन:"}</span>
                    <span className="font-bold text-emerald-400">Gemini 2.5 + Groq</span>
                  </div>
                </div>

                <Link
                  href="/examiner"
                  className="w-full py-2.5 rounded-lg bg-[#631438] hover:bg-[#7b1945] text-white font-bold text-xs uppercase tracking-wider block transition-all shadow-md"
                >
                  {lang === "en" ? "Access Evaluator Workspace" : "परीक्षक कार्यक्षेत्र में प्रवेश करें"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Slider Controls Bar */}
        <div className="bg-black/40 border-t border-white/10 px-4 py-2 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            {/* Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSlide((prev) => (prev === 0 ? 2 : prev - 1))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Previous Slide"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Next Slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Dots + Pause */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2.5 rounded-full transition-all ${activeSlide === idx ? "w-8 bg-amber-400" : "w-2.5 bg-white/30 hover:bg-white/50"}`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setIsCarouselPlaying(!isCarouselPlaying)}
                className="p-1 text-slate-300 hover:text-white transition-colors"
                title={isCarouselPlaying ? "Pause Slider" : "Play Slider"}
              >
                {isCarouselPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          3. ANNOUNCEMENTS MARQUEE TICKER (EXACT DOHE ANNOUNCEMENT BAR)
      ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#f5eef2] border-b border-[#ebdbe2] text-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
          {/* Burgundy Badge */}
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded bg-[#631438] text-white text-xs font-bold uppercase tracking-wider shadow-xs">
            <Volume2 size={14} />
            <span>{lang === "en" ? "Announcements" : "सूचनाएं"}</span>
          </div>

          {/* Marquee Content */}
          <div className="overflow-hidden whitespace-nowrap flex-1 text-xs sm:text-sm font-medium">
            <div
              className={`inline-block animate-marquee ${isMarqueePlaying ? "" : "paused"}`}
              style={{
                animation: isMarqueePlaying ? "marquee 28s linear infinite" : "none",
              }}
            >
              {announcements.map((item, idx) => (
                <span key={idx} className="mx-6 hover:text-[#631438] cursor-pointer inline-flex items-center gap-2">
                  <span className="text-[#631438] font-bold">★</span>
                  <span>{lang === "en" ? item.en : item.hi}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Pause / Play control for accessibility */}
          <button
            onClick={() => setIsMarqueePlaying(!isMarqueePlaying)}
            className="shrink-0 p-1 text-[#631438] hover:bg-[#631438]/10 rounded transition-colors"
            title={isMarqueePlaying ? "Pause ticker" : "Resume ticker"}
          >
            {isMarqueePlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          4. LEADERSHIP & QUOTE SECTION (EXACT DOHE LAYOUT)
      ─────────────────────────────────────────────────────────── */}
      <section id="leadership" className="py-12 bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* PM Narendra Modi Quote Card */}
            <div className="lg:col-span-6 flex flex-col sm:flex-row items-center gap-6 bg-[#fcf8fa] p-6 rounded-2xl border border-[#ebdbe2]">
              <div className="shrink-0 relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#631438]/20 shadow-md bg-gradient-to-tr from-[#631438] to-amber-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {/* Portrait Avatar / Graphic */}
                    <div className="w-full h-full bg-[#f1f5f9] flex flex-col items-center justify-center text-center p-2">
                      <div className="w-16 h-16 rounded-full bg-[#631438]/10 flex items-center justify-center text-[#631438] mb-1 font-bold text-xl">
                        PM
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">
                        Shri Narendra Modi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-4xl font-serif text-[#631438] leading-none">“</span>
                <p className="text-sm sm:text-base italic text-[#334155] font-serif leading-relaxed">
                  {lang === "en"
                    ? "India's university campuses are emerging as dynamic centres where Yuvashakti drives breakthrough innovations and transparent digital governance."
                    : "भारत के विश्वविद्यालय परिसर ऐसे जीवंत केंद्र बन रहे हैं जहाँ युवा शक्ति नवाचारों और पारदर्शी डिजिटल सुशासन को गति दे रही है।"}
                </p>
                <div className="border-t border-[#e2e8f0] pt-2">
                  <div className="text-xs font-bold text-[#631438] uppercase tracking-wider">
                    {lang === "en"
                      ? "Prime Minister Shri Narendra Modi"
                      : "प्रधानमंत्री श्री नरेन्द्र मोदी"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === "en"
                      ? "National Higher Education Conclave"
                      : "राष्ट्रीय उच्च शिक्षा सम्मेलन सम्बोधन"}
                  </div>
                </div>
              </div>
            </div>

            {/* Dignitaries Mini Cards (Education Ministers) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 text-center hover:shadow-md transition-all hover:border-[#631438]">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 border-2 border-slate-200 mb-3 flex items-center justify-center font-bold text-[#631438] text-lg">
                  DP
                </div>
                <h4 className="text-xs font-bold text-[#0f172a] leading-tight">
                  {lang === "en" ? "Shri Dharmendra Pradhan" : "श्री धर्मेन्द्र प्रधान"}
                </h4>
                <p className="text-[10px] text-[#631438] font-bold uppercase mt-1">
                  {lang === "en" ? "Hon'ble Minister of Education" : "माननीय शिक्षा मंत्री"}
                </p>
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 text-center hover:shadow-md transition-all hover:border-[#631438]">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 border-2 border-slate-200 mb-3 flex items-center justify-center font-bold text-[#631438] text-lg">
                  SM
                </div>
                <h4 className="text-xs font-bold text-[#0f172a] leading-tight">
                  {lang === "en" ? "Dr. Sukanta Majumdar" : "डॉ. सुकांत मजूमदार"}
                </h4>
                <p className="text-[10px] text-[#631438] font-bold uppercase mt-1">
                  {lang === "en" ? "Hon'ble Minister of State" : "माननीय राज्य मंत्री"}
                </p>
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 text-center hover:shadow-md transition-all hover:border-[#631438]">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 border-2 border-slate-200 mb-3 flex items-center justify-center font-bold text-[#631438] text-lg">
                  JC
                </div>
                <h4 className="text-xs font-bold text-[#0f172a] leading-tight">
                  {lang === "en" ? "Shri Jayant Chaudhary" : "श्री जयंत चौधरी"}
                </h4>
                <p className="text-[10px] text-[#631438] font-bold uppercase mt-1">
                  {lang === "en" ? "Hon'ble Minister of State (I/C)" : "माननीय राज्य मंत्री (स्वतंत्र प्रभार)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          5. ABOUT US & KEY BUREAUS (EXACT DOHE CARDS)
      ─────────────────────────────────────────────────────────── */}
      <section id="about" className="py-12 bg-[#fafbfc] border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4 text-[#631438]">
            <Building size={22} />
            <h3 className="text-2xl font-black text-[#0f172a]">
              {lang === "en" ? "About Us" : "हमारे बारे में"}
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {lang === "en"
                  ? "The Department of Higher Education (MoE), Government of India, is responsible for the overall development and standardisation of tertiary education policy, infrastructure, and nationwide evaluation frameworks. In collaboration with MPOnline, the ExamSetu AI On-Screen Evaluation System establishes an equitable, tamper-evident digital assessment pipeline for university semester examinations."
                  : "उच्च शिक्षा विभाग (शिक्षा मंत्रालय), भारत सरकार, उच्च शिक्षा क्षेत्र के समग्र विकास, नीति निर्माण एवं मूल्यांकन रूपरेखा के लिए उत्तरदायी है। एमपीऑनलाइन के सहयोग से, एग्जामसेतु एआई ऑन-स्क्रीन मूल्यांकन प्रणाली विश्वविद्यालय परीक्षाओं के लिए एक पारदर्शी, सुरक्षित एवं त्वरित डिजिटल मूल्यांकन मंच प्रदान करती है।"}
              </p>

              {/* 3 DOHE Bordered Bureau / Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2" id="bureaus">
                <Link
                  href="/examiner"
                  className="p-4 rounded-xl border border-[#ebdbe2] bg-white hover:border-[#631438] hover:bg-[#fcf5f8] transition-all text-center group"
                >
                  <Users size={24} className="mx-auto text-[#631438] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#0f172a] uppercase">
                    {lang === "en" ? "Our Evaluator Team" : "परीक्षक दल"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {lang === "en" ? "250+ Certified Examiners" : "250+ प्रमाणित परीक्षक"}
                  </div>
                </Link>

                <Link
                  href="/controller/dashboard"
                  className="p-4 rounded-xl border border-[#ebdbe2] bg-white hover:border-[#631438] hover:bg-[#fcf5f8] transition-all text-center group"
                >
                  <Building size={24} className="mx-auto text-[#631438] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#0f172a] uppercase">
                    {lang === "en" ? "Our Evaluation Bureaus" : "मूल्यांकन केंद्र"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {lang === "en" ? "52 Regional Hubs" : "52 क्षेत्रीय केंद्र"}
                  </div>
                </Link>

                <Link
                  href="/admin/audit"
                  className="p-4 rounded-xl border border-[#ebdbe2] bg-white hover:border-[#631438] hover:bg-[#fcf5f8] transition-all text-center group"
                >
                  <BarChart3 size={24} className="mx-auto text-[#631438] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#0f172a] uppercase">
                    {lang === "en" ? "Audit & Performance" : "ऑडिट एवं निष्पादन"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {lang === "en" ? "100% Cryptographic Trail" : "100% अपरिवर्तनीय ऑडिट"}
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Overview Highlights Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm" id="stats">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-[#631438] mb-3">
                {lang === "en" ? "Key Performance Indicators (KPIs)" : "प्रमुख प्रदर्शन संकेतक"}
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{lang === "en" ? "On-Screen Marking Progress" : "ऑन-स्क्रीन मार्किंग प्रगति"}</span>
                    <span className="text-[#631438]">94.2%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#631438] rounded-full" style={{ width: "94.2%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{lang === "en" ? "AI Handwriting Transcription Accuracy" : "एआई हस्तलेख पहचान सटीकता"}</span>
                    <span className="text-emerald-700">99.4%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: "99.4%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{lang === "en" ? "Double-Blind Moderation Rate" : "डबल-ब्लाइंड मॉडरेशन दर"}</span>
                    <span className="text-blue-700">100% (Var &gt; 10%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          6. KEY OFFERINGS & WHAT'S NEW SECTION (EXACT DOHE LAYOUT)
      ─────────────────────────────────────────────────────────── */}
      <section id="offerings" className="py-12 bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Key Offerings */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-4 text-[#631438]">
                <Layers size={22} />
                <h3 className="text-2xl font-black text-[#0f172a]">
                  {lang === "en" ? "Key Offerings" : "प्रमुख सेवाएं व योजनाएं"}
                </h3>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#ebdbe2] mb-4">
                <button
                  onClick={() => setOfferingsTab("schemes")}
                  className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${offeringsTab === "schemes" ? "border-[#631438] text-[#631438] bg-[#fcf5f8]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                >
                  {lang === "en" ? "Schemes & Services" : "योजनाएं एवं सेवाएं"}
                </button>
                <button
                  onClick={() => setOfferingsTab("vacancies")}
                  className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${offeringsTab === "vacancies" ? "border-[#631438] text-[#631438] bg-[#fcf5f8]" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                >
                  {lang === "en" ? "Examiner Empanelment" : "परीक्षक पैनल भर्ती"}
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-xl overflow-hidden bg-white shadow-xs">
                {offeringsTab === "schemes" ? (
                  <>
                    <Link
                      href="/examiner"
                      className="p-4 flex items-center justify-between hover:bg-[#fcf5f8] transition-colors group"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#631438]">
                          {lang === "en"
                            ? "Digital Answer Sheet On-Screen Evaluation (ExamSetu DOSES)"
                            : "डिजिटल उत्तरपुस्तिका ऑन-स्क्रीन मूल्यांकन प्रणाली"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lang === "en"
                            ? "Split PDF answer scripts, question rubrics, handwriting OCR, and quick marking."
                            : "विभाजित पीडीएफ उत्तरपुस्तिकाएं, रूब्रिक्स, हस्तलेखन ओसीआर एवं त्वरित अंकन।"}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#631438] group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                      href="/controller/dashboard"
                      className="p-4 flex items-center justify-between hover:bg-[#fcf5f8] transition-colors group"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#631438]">
                          {lang === "en"
                            ? "Double-Blind Discrepancy Moderation System"
                            : "डबल-ब्लाइंड विचलन समाधान एवं मॉडरेशन प्रणाली"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lang === "en"
                            ? "Automated routing to chief examiners for scores differing by more than 10%."
                            : "10% से अधिक अंतर होने पर मुख्य परीक्षकों को स्वचालित रूटिंग।"}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#631438] group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                      href="/admin/audit"
                      className="p-4 flex items-center justify-between hover:bg-[#fcf5f8] transition-colors group"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#631438]">
                          {lang === "en"
                            ? "Ed25519 Cryptographic Proof & Hash Chain Audit"
                            : "Ed25519 क्रिप्टोग्राफिक प्रमाण एवं हैश चेन ऑडिट"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lang === "en"
                            ? "Every mark, override, and moderation is signed and sealed permanently."
                            : "प्रत्येक अंक, ओवरराइड और मॉडरेशन पर स्थायी डिजिटल मुहर।"}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#631438] group-hover:translate-x-1 transition-all" />
                    </Link>

                    <a
                      href="#about"
                      className="p-4 flex items-center justify-between hover:bg-[#fcf5f8] transition-colors group"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#631438]">
                          {lang === "en"
                            ? "Rashtriya Uchchatar Shiksha Abhiyan (RUSA)"
                            : "राष्ट्रीय उच्चतर शिक्षा अभियान (रूसा)"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lang === "en"
                            ? "Centrally sponsored scheme for funding state universities and examination automation."
                            : "राज्य विश्वविद्यालयों के वित्तपोषण एवं परीक्षा डिजिटलीकरण हेतु केंद्रीय योजना।"}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#631438] group-hover:translate-x-1 transition-all" />
                    </a>
                  </>
                ) : (
                  <>
                    <div className="p-4 flex items-center justify-between hover:bg-[#fcf5f8] transition-colors group">
                      <div>
                        <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#631438]">
                          {lang === "en"
                            ? "Empanelment of Chief Evaluators: Engineering & Technology 2026"
                            : "मुख्य मूल्यांकनकर्ता पैनल: इंजीनियरिंग एवं प्रौद्योगिकी 2026"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lang === "en" ? "Deadline: 15 October 2026 • 80 Vacancies" : "अंतिम तिथि: 15 अक्टूबर 2026 • 80 पद"}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#631438] bg-[#631438]/10 px-2.5 py-1 rounded">
                        {lang === "en" ? "Apply Online" : "आवेदन करें"}
                      </span>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-[#fcf5f8] transition-colors group">
                      <div>
                        <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#631438]">
                          {lang === "en"
                            ? "Subject Experts for Humanities and Social Sciences Evaluation"
                            : "मानविकी एवं समाज विज्ञान मूल्यांकन हेतु विषय विशेषज्ञ"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lang === "en" ? "Active across all MP State Universities" : "मध्य प्रदेश के समस्त राज्य विश्वविद्यालयों में लागू"}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#631438] bg-[#631438]/10 px-2.5 py-1 rounded">
                        {lang === "en" ? "Apply Online" : "आवेदन करें"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: DOHE Maroon "What's New" Box */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#631438] text-white p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-3">
                  <Sparkles size={20} className="text-amber-300" />
                  <h3 className="text-lg font-black uppercase tracking-wider">
                    {lang === "en" ? "What's New" : "नवीनतम अपडेट"}
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <Link
                    href="/controller/dashboard"
                    className="block p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white group-hover:text-amber-300 transition-colors leading-relaxed">
                        {lang === "en"
                          ? "Real-time AI Anomaly Radar v2.4 activated for evaluation speed & uniformity monitoring"
                          : "मूल्यांकन गति एवं एकरूपता निगरानी हेतु रीयल-टाइम एआई एनोमली रडार v2.4 सक्रिय"}
                      </p>
                      <ChevronRight size={16} className="shrink-0 text-white/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1 block">30.09.2026</span>
                  </Link>

                  <Link
                    href="/examiner"
                    className="block p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white group-hover:text-amber-300 transition-colors leading-relaxed">
                        {lang === "en"
                          ? "Keyboard Shortcuts enabled: Arrow keys for question navigation & 0-9 quick marks"
                          : "शॉर्टकट सक्रिय: प्रश्न नेविगेशन हेतु तीर कुंजियां और त्वरित अंक प्रविष्टि"}
                      </p>
                      <ChevronRight size={16} className="shrink-0 text-white/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1 block">29.09.2026</span>
                  </Link>

                  <Link
                    href="/admin/audit"
                    className="block p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white group-hover:text-amber-300 transition-colors leading-relaxed">
                        {lang === "en"
                          ? "Standard Operating Procedure: Cryptographic integrity & DPDP 2025 compliance"
                          : "मानक संचालन प्रक्रिया: क्रिप्टोग्राफिक अखंडता एवं डीपीओपी 2025 अनुपालन"}
                      </p>
                      <ChevronRight size={16} className="shrink-0 text-white/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="text-[10px] text-slate-300 mt-1 block">28.09.2026</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          7. ROLE ACCESS PORTALS (CORE HACKATHON INNOVATION WORKSPACES)
      ─────────────────────────────────────────────────────────── */}
      <section className="py-14 bg-[#f8f9fb] border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#631438] bg-[#631438]/10 px-3 py-1 rounded-full">
              {lang === "en" ? "Integrated Access" : "एकीकृत पोर्टल प्रवेश"}
            </span>
            <h3 className="text-3xl font-black text-[#0f172a] mt-2">
              {lang === "en" ? "ExamSetu AI Evaluation Portals" : "एग्जामसेतु एआई मूल्यांकन मंच"}
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              {lang === "en"
                ? "Select your role to access the dedicated on-screen evaluation and administration suites."
                : "अपनी भूमिका चुनकर संबंधित डिजिटल मूल्यांकन एवं प्रशासन प्रणाली में प्रवेश करें।"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Examiner Workspace */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#631438] p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#631438]/10 text-[#631438] flex items-center justify-center mb-4 group-hover:bg-[#631438] group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <div className="text-xs font-extrabold text-[#631438] uppercase tracking-wider mb-1">
                  {lang === "en" ? "For Appointed Teachers" : "नियुक्त शिक्षकों हेतु"}
                </div>
                <h4 className="text-xl font-bold text-[#0f172a] mb-2">
                  {lang === "en" ? "Examiner Portal" : "परीक्षक पोर्टल"}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {lang === "en"
                    ? "Evaluate assigned student answer scripts with PDF split viewer, Gemini handwriting OCR, Groq AI rubric suggestions, and digital stamps."
                    : "पीडीएफ आंसर शीट व्यूअर, जेमिनी हस्तलेखन ओसीआर, ग्रोक एआई रूब्रिक्स और डिजिटल स्टैम्प्स के साथ उत्तरपुस्तिका जांचें।"}
                </p>
                <div className="space-y-1.5 text-xs text-slate-700 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "Question-wise marking rubric" : "प्रश्नवार अंकन रूब्रिक"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "Instant AI suggestions with confidence score" : "आत्मविश्वास स्कोर सहित एआई सुझाव"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "Auto calculation & total verification" : "स्वचालित योग गणना व सत्यापन"}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/examiner"
                className="w-full py-2.5 rounded-lg bg-[#631438] hover:bg-[#4d0f2b] text-white font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{lang === "en" ? "Launch Workspace" : "कार्यक्षेत्र खोलें"}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Controller Hub */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#0f172a] p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center mb-4 group-hover:bg-[#0f172a] group-hover:text-white transition-colors">
                  <Sliders size={24} />
                </div>
                <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  {lang === "en" ? "Examination Controllers" : "परीक्षा नियंत्रक हेतु"}
                </div>
                <h4 className="text-xl font-bold text-[#0f172a] mb-2">
                  {lang === "en" ? "Controller Dashboard" : "नियंत्रक डैशबोर्ड"}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {lang === "en"
                    ? "Live progress tracking, speed/bias anomaly radar, double-blind moderation resolution, examiner quota management, and CSV marksheet export."
                    : "लाइव प्रगति ट्रैकिंग, गति एवं पूर्वाग्रह एनोमली रडार, डबल-ब्लाइंड मॉडरेशन समाधान एवं सीएसवी अंकसूची निर्यात।"}
                </p>
                <div className="space-y-1.5 text-xs text-slate-700 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "Real-time SSE live updates" : "रीयल-टाइम एसएसई लाइव अपडेट्स"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "Automated anomaly flags & outliers" : "स्वचालित एनोमली व गति चेतावनी"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "Re-evaluation & double mark routing" : "पुनर्मूल्यांकन एवं दोहरी जांच रूटिंग"}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/controller/dashboard"
                className="w-full py-2.5 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{lang === "en" ? "Open Dashboard" : "डैशबोर्ड खोलें"}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Admin Console */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-violet-600 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Shield size={24} />
                </div>
                <div className="text-xs font-extrabold text-violet-700 uppercase tracking-wider mb-1">
                  {lang === "en" ? "System Administrators" : "सिस्टम एडमिनिस्ट्रेटर हेतु"}
                </div>
                <h4 className="text-xl font-bold text-[#0f172a] mb-2">
                  {lang === "en" ? "Admin Management" : "प्रशासन प्रबंधन"}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {lang === "en"
                    ? "Upload bulk PDF answer sheets, configure AI models (Gemini & Groq), manage evaluator empanelment, and inspect Ed25519 hash chain logs."
                    : "थोक उत्तरपुस्तिका अपलोड, एआई मॉडल कॉन्फ़िगरेशन, परीक्षक आवंटन एवं Ed25519 क्रिप्टोग्राफिक ऑडिट लॉग निरीक्षण।"}
                </p>
                <div className="space-y-1.5 text-xs text-slate-700 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "PDF bundle upload & splitting" : "पीडीएफ बंडल अपलोड एवं विभाजन"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "Ed25519 tamper-proof verification" : "Ed25519 छेड़छाड़-मुक्त सत्यापन"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>{lang === "en" ? "AI provider threshold toggles" : "एआई प्रदाता व थ्रेशोल्ड सेटिंग्स"}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/admin/exams"
                className="w-full py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{lang === "en" ? "Enter Admin Suite" : "एडमिन पैनल खोलें"}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          8. MULTIMEDIA, VIDEOS & INITIATIVES (EXACT DOHE LAYOUT)
      ─────────────────────────────────────────────────────────── */}
      <section id="multimedia" className="py-12 bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[#631438]">
              <Award size={22} />
              <h3 className="text-2xl font-black text-[#0f172a]">
                {lang === "en" ? "Key Initiatives & Media" : "प्रमुख पहल एवं मीडिया"}
              </h3>
            </div>
            <a href="#about" className="text-xs font-bold text-[#631438] hover:underline flex items-center gap-1">
              <span>{lang === "en" ? "View All" : "सभी देखें"}</span>
              <ChevronRight size={14} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DPDP Rule card */}
            <div className="rounded-xl border border-[#cbd5e1] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  Data Governance
                </span>
                <h4 className="text-base font-bold mt-3 leading-snug">
                  {lang === "en"
                    ? "Digital Personal Data Protection (DPDP) Act Compliance in Examinations"
                    : "परीक्षा प्रणाली में डिजिटल व्यक्तिगत डेटा संरक्षण (डीपीडीपी) अनुपालन"}
                </h4>
                <p className="text-xs text-slate-300 mt-2">
                  {lang === "en"
                    ? "End-to-end anonymization of candidate roll numbers with barcode masking to prevent evaluation bias."
                    : "मूल्यांकन में निष्पक्षता सुनिश्चित करने हेतु छात्र रोल नंबर एवं पहचान का पूर्ण डिजिटली मास्किंग।"}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>{lang === "en" ? "Security Standard" : "सुरक्षा मानक"}</span>
                <span className="font-bold text-emerald-400">ISO 27001</span>
              </div>
            </div>

            {/* Video Showcase Card */}
            <div className="rounded-xl border border-[#cbd5e1] overflow-hidden bg-white shadow-xs group">
              <div className="relative h-44 bg-slate-900 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="w-14 h-14 rounded-full bg-[#631438] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={24} className="ml-1" />
                </div>
                <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
                  04:30
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#0f172a] group-hover:text-[#631438] transition-colors leading-snug">
                  {lang === "en"
                    ? "On-Screen Marking System: Transformative Journey of MP Universities"
                    : "ऑन-स्क्रीन मार्किंग प्रणाली: मध्य प्रदेश विश्वविद्यालयों की परिवर्तनकारी यात्रा"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === "en"
                    ? "Watch how examiners evaluate papers with AI suggestions and complete audits."
                    : "देखें कि कैसे परीक्षक एआई सुझावों और पूर्ण ऑडिट के साथ कॉपियां जांचते हैं।"}
                </p>
              </div>
            </div>

            {/* Viksit Bharat Buildathon Card */}
            <div className="rounded-xl border border-[#cbd5e1] overflow-hidden bg-[#faf8f5] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded border border-amber-400/30">
                  Viksit Bharat 2047
                </span>
                <h4 className="text-base font-bold text-[#0f172a] mt-3 leading-snug">
                  {lang === "en"
                    ? "Buildathon 2026: Youth Innovation for Next-Gen Public Examination"
                    : "बिल्डाथॉन 2026: सार्वजनिक परीक्षा सुधार हेतु युवा नवाचार"}
                </h4>
                <p className="text-xs text-slate-600 mt-2">
                  {lang === "en"
                    ? "Empowering students and faculty to engineer transparent, accountable, AI-driven governance platforms."
                    : "पारदर्शी, जवाबदेह और एआई-संचालित शासन मंचों के निर्माण हेतु छात्रों और शिक्षकों का सशक्तिकरण।"}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>{lang === "en" ? "Ministry of Education" : "शिक्षा मंत्रालय"}</span>
                <span className="font-bold text-[#631438]">MPOnline Hackathon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          9. PARTNER PORTALS CAROUSEL LOGOS (EXACT DOHE PARTNER LOGOS)
      ─────────────────────────────────────────────────────────── */}
      <section className="py-8 bg-[#f8f9fa] border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            {lang === "en" ? "National & State Government Portals" : "राष्ट्रीय एवं राज्य शासकीय पोर्टल"}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center">
            <div className="p-3 bg-white rounded-lg border border-[#e2e8f0] text-center shadow-2xs hover:border-[#631438] transition-colors">
              <span className="font-black text-[#631438] text-sm tracking-tight">india.gov.in</span>
              <span className="block text-[9px] text-slate-400">National Portal</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#e2e8f0] text-center shadow-2xs hover:border-[#631438] transition-colors">
              <span className="font-black text-amber-600 text-sm tracking-tight">myGov मेरी सरकार</span>
              <span className="block text-[9px] text-slate-400">Citizen Engagement</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#e2e8f0] text-center shadow-2xs hover:border-[#631438] transition-colors">
              <span className="font-black text-blue-700 text-sm tracking-tight">NSP Portal</span>
              <span className="block text-[9px] text-slate-400">Scholarship Hub</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#e2e8f0] text-center shadow-2xs hover:border-[#631438] transition-colors">
              <span className="font-black text-emerald-700 text-sm tracking-tight">SWAGATAM</span>
              <span className="block text-[9px] text-slate-400">Visitor Gateway</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#e2e8f0] text-center shadow-2xs hover:border-[#631438] transition-colors">
              <span className="font-black text-purple-700 text-sm tracking-tight">data.gov.in</span>
              <span className="block text-[9px] text-slate-400">Open Data Platform</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#e2e8f0] text-center shadow-2xs hover:border-[#631438] transition-colors">
              <span className="font-black text-[#631438] text-sm tracking-tight">MPOnline Limited</span>
              <span className="block text-[9px] text-slate-400">Citizen Services</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          10. BURGUNDY OFFICIAL GOVERNMENT FOOTER (EXACT DOHE FOOTER)
      ─────────────────────────────────────────────────────────── */}
      <footer id="footer" className="bg-[#5c1335] text-white pt-12 pb-8 border-t border-[#460c25]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/15">
            {/* Useful Links (4 cols) */}
            <div className="md:col-span-8 space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                {lang === "en" ? "Useful Links & Policies" : "उपयोगी लिंक एवं नीतियां"}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-200">
                <div className="space-y-2">
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Archives" : "अभिलेखागार"}
                  </a>
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Sitemap" : "साइटमैप"}
                  </a>
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "RTI" : "सूचना का अधिकार"}
                  </a>
                </div>
                <div className="space-y-2">
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Website Policies" : "वेबसाइट नीतियां"}
                  </a>
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Help & FAQ" : "सहायता एवं प्रश्न"}
                  </a>
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Feedback" : "प्रतिक्रिया"}
                  </a>
                </div>
                <div className="space-y-2">
                  <Link href="/examiner" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Examiner Portal" : "परीक्षक पोर्टल"}
                  </Link>
                  <Link href="/controller/dashboard" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Controller Hub" : "नियंत्रक हब"}
                  </Link>
                  <Link href="/admin/audit" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Audit Log Trail" : "ऑडिट लॉग"}
                  </Link>
                </div>
                <div className="space-y-2">
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Terms & Conditions" : "नियम एवं शर्तें"}
                  </a>
                  <a href="#about" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Contact Us" : "संपर्क सूत्र"}
                  </a>
                  <Link href="/login" className="block hover:text-amber-300 transition-colors">
                    › {lang === "en" ? "Employee Login" : "कर्मचारी लॉगिन"}
                  </Link>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-300 leading-relaxed max-w-2xl">
                {lang === "en"
                  ? "This Website belongs to the Department of Higher Education, Ministry of Education, Government of India. The ExamSetu AI On-Screen Marking System is powered in collaboration with MPOnline Limited."
                  : "यह वेबसाइट उच्च शिक्षा विभाग, शिक्षा मंत्रालय, भारत सरकार के अधीन है। एग्जामसेतु एआई ऑन-स्क्रीन मार्किंग प्रणाली एमपीऑनलाइन लिमिटेड के सहयोग से संचालित है।"}
              </div>
            </div>

            {/* Social & Badges (4 cols) */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                {lang === "en" ? "Connect & Updates" : "जुड़ें एवं अपडेट प्राप्त करें"}
              </h4>

              <div className="flex items-center gap-3">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Twitter / X"
                >
                  𝕏
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="YouTube"
                >
                  ▶
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Facebook"
                >
                  f
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Instagram"
                >
                  📸
                </a>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="px-3 py-1.5 rounded bg-white text-[#5c1335] font-black text-xs">
                  myGov मेरी सरकार
                </div>
                <div className="px-3 py-1.5 rounded bg-white text-[#5c1335] font-black text-xs">
                  india.gov.in
                </div>
              </div>

              <div className="text-[11px] text-slate-300 pt-1">
                {lang === "en" ? "Last Updated On: 30 September 2026" : "अंतिम अद्यतन: 30 सितंबर 2026"}
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-2">
            <div>
              © 2026 {lang === "en" ? "Department of Higher Education, Govt. of India & MPOnline." : "उच्च शिक्षा विभाग, भारत सरकार एवं एमपीऑनलाइन।"}
            </div>
            <div className="flex items-center gap-4">
              <span>{lang === "en" ? "Designed for MPOnline Hackathon" : "एमपीऑनलाइन हैकाथॉन हेतु विकसित"}</span>
              <span>•</span>
              <span className="font-mono text-amber-300">ExamSetu AI v2.4</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Scroll-to-Top Button (Like DOHE burgundy round arrow) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#5c1335] hover:bg-[#460c25] text-white shadow-xl flex items-center justify-center transition-all z-50 border-2 border-white/20 hover:scale-105"
          title="Back to Top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
