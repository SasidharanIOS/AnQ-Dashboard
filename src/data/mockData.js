export const customerDashboard = {
  activeMove: {
    jobId: "ANQ-260014",
    status: "Awaiting Your Decision",
    moveType: "House Move",
    from: "London, SW15 2AA",
    to: "Manchester, M14 5AB",
    date: "22 June 2025",
    note: "You have 3 verified quotes. Choose the best fit for your move.",
    progress: 85
  },
  stats: [
    { label: "New Messages", value: "3", link: "View messages", tone: "red" },
    { label: "Quotes Received", value: "3", link: "View quotes", tone: "blue" },
    { label: "Deposit to Book", value: "£50", link: "How it works", tone: "navy" }
  ],
  quotes: [
    { vendor: "MoveMaster", logo: "M", rating: "4.9", reviews: "128", member: "Member of BAR", exp: "5+ years on AnQ Movers", amount: "£680", availability: "15 Jun 2025", movers: "2 Professional Movers", primary: true },
    { vendor: "QuickMove", logo: "Q", rating: "4.8", reviews: "96", member: "Member of BAR", exp: "3+ years on AnQ Movers", amount: "£750", availability: "15 Jun 2025", movers: "2 Professional Movers" },
    { vendor: "SimplyMoves", logo: "S", rating: "4.7", reviews: "74", member: "Member of BAR", exp: "4+ years on AnQ Movers", amount: "£825", availability: "15 Jun 2025", movers: "3 Professional Movers" }
  ],
  messages: [
    { name: "MoveMaster", logo: "M", text: "Thanks for the additional information.", time: "10:30 AM", unread: 2 },
    { name: "QuickMove", logo: "Q", text: "Can you confirm parking availability?", time: "Yesterday", unread: 1 },
    { name: "SimplyMoves", logo: "S", text: "We’re available on your selected date.", time: "12 May", unread: 0 }
  ],
  nextSteps: [
    { title: "Move request submitted", date: "12 May 2025", done: true },
    { title: "Move profile completed", date: "12 May 2025", done: true },
    { title: "Compare quotes & choose mover", desc: "You have 3 quotes. Choose the best fit.", current: true },
    { title: "Pay deposit to secure booking", desc: "Amount: £50 deducted from final cost" },
    { title: "Move confirmed", desc: "We’ll help you on moving day." }
  ]
};

export const vendorDashboard = {
  stats: [
    { label: "New Leads", value: 6, sub: "+2 vs yesterday", icon: "users", tone: "blue", link: "View new leads" },
    { label: "Quotes Submitted", value: 12, sub: "+3 vs yesterday", icon: "clipboard", tone: "blue", link: "View all quotes" },
    { label: "Won Jobs", value: 5, sub: "+1 vs last 7 days", icon: "shield", tone: "green", link: "View won jobs" },
    { label: "Pending Actions", value: 4, sub: "Requires your attention", icon: "alert", tone: "red", link: "View pending" }
  ],
  lead: { jobId: "ANQ-260987", status: "New Lead", from: "London, SW15 2AA", to: "Manchester, M14 5AB", date: "22 June 2025", preferred: "22 - 24 June", property: "3 Bed House", size: "1,200 - 1,500 sq ft", match: 90 },
  enquiries: [
    { jobId: "ANQ-260987", status: "New Lead", from: "London, SW15 2AA", to: "Manchester, M14 5AB", date: "22 Jun 2025", property: "3 Bed House", size: "1,200 - 1,500 sq ft", match: 90 },
    { jobId: "ANQ-260912", status: "Contacted", from: "Bristol, BS8 1TH", to: "Leeds, LS1 2TW", date: "25 Jun 2025", property: "2 Bed Flat", size: "800 - 1,000 sq ft", match: 75 },
    { jobId: "ANQ-260901", status: "Quoted", from: "Glasgow, G12 8QE", to: "Edinburgh, EH3 9DF", date: "28 Jun 2025", property: "4 Bed House", size: "1,500 - 2,000 sq ft", match: 85 },
    { jobId: "ANQ-260876", status: "Pending", from: "Birmingham, B15 1AA", to: "London, N1 7GU", date: "30 Jun 2025", property: "1 Bed Flat", size: "400 - 600 sq ft", match: 65 }
  ],
  messages: [
    { name: "ANQ-260987", logo: "AN", text: "Thanks for your quick response...", time: "10:30 AM", unread: 2 },
    { name: "ANQ-260912", logo: "AN", text: "Can you confirm availability for...", time: "Yesterday", unread: 1 },
    { name: "ANQ-260901", logo: "AN", text: "Great, thank you. Please send...", time: "12 May", unread: 0 }
  ],
  jobs: [
    { jobId: "ANQ-260845", status: "Confirmed", date: "18 June 2025", route: "London, E14 5AB → Croydon, CR0 1XX" },
    { jobId: "ANQ-260832", status: "Confirmed", date: "21 June 2025", route: "Reading, RG1 1AA → Oxford, OX1 1AA" },
    { jobId: "ANQ-260829", status: "Pending", date: "24 June 2025", route: "Southampton, SO15 1AA → Portsmouth, PO1 2AA" }
  ]
};

export const adminDashboard = {
  stats: [
    { label: "Total Active Jobs", value: "1,245", change: "12.5%", tone: "blue", icon: "calendar" },
    { label: "In-Progress Jobs", value: "368", change: "8.3%", tone: "orange", icon: "hourglass" },
    { label: "Completed Jobs", value: "2,847", change: "15.7%", tone: "green", icon: "check" },
    { label: "Total Deposits", value: "£187,560", change: "10.2%", tone: "purple", icon: "pound" }
  ],
  jobs: [
    { jobId: "ANQ-260015", customer: "Sarah Johnson", customerId: "CUS-1024", phone: "07712 345678", moveType: "House Move", size: "3 Bed House", route: "London, SW15 2AA → Manchester, M14 5AB", date: "18 Jun 2025", status: "In Progress", vendor: "MoveMaster", rating: "4.9" },
    { jobId: "ANQ-260014", customer: "James Carter", customerId: "CUS-1023", phone: "07956 123456", moveType: "Office Move", size: "Small Office", route: "Birmingham, B11 4A → Leeds, LS1 2AB", date: "17 Jun 2025", status: "Confirmed", vendor: "QuickMove", rating: "4.8" },
    { jobId: "ANQ-260013", customer: "Emily Brown", customerId: "CUS-1022", phone: "07890 987654", moveType: "House Move", size: "2 Bed Flat", route: "Bristol, BS1 4AA → Reading, RG1 2AB", date: "16 Jun 2025", status: "Pending", vendor: null },
    { jobId: "ANQ-260012", customer: "Daniel Lee", customerId: "CUS-1021", phone: "07421 765432", moveType: "House Move", size: "4 Bed House", route: "Glasgow, G1 1AA → Edinburgh, EH1 1AA", date: "15 Jun 2025", status: "Completed", vendor: "SimplyMoves", rating: "4.7" }
  ],
  assignments: [
    { jobId: "ANQ-260016", route: "London → Southampton", date: "18 Jun 2025" },
    { jobId: "ANQ-260017", route: "Birmingham → Nottingham", date: "18 Jun 2025" },
    { jobId: "ANQ-260018", route: "Leeds → Sheffield", date: "19 Jun 2025" }
  ],
  status: [
    { label: "Active", count: "5,326", change: "8.6%", tone: "green" },
    { label: "Restricted", count: "124", change: "3.2%", tone: "orange", down: true },
    { label: "Suspended", count: "28", change: "12.5%", tone: "red", down: true },
    { label: "Total Customers", count: "5,478", change: "6.4%", tone: "green" }
  ],
  activity: [
    "Vendor MoveMaster was verified by Admin",
    "Job ANQ-260014 status changed to Confirmed",
    "Payment of £250 received for Job ANQ-260012",
    "New customer registered: Michael Taylor",
    "Job ANQ-260011 assigned to QuickMove"
  ]
};
