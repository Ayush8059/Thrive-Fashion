import { motion } from "framer-motion";
import {
  HeartHandshake,
  Leaf,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  MessagesSquare,
} from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const highlights = [
  {
    title: "Sustainable fashion that stays useful",
    description:
      "Thrive helps good clothing stay in circulation. Users can resell, donate, and discover pre-loved pieces instead of letting them go to waste.",
    icon: Leaf,
  },
  {
    title: "A trusted community marketplace",
    description:
      "Every listing is tied to a real authenticated account, so buyers and sellers interact inside one secure platform with orders, chats, and history.",
    icon: Users,
  },
  {
    title: "Built with safety in mind",
    description:
      "Authentication, protected routes, database policies, and role-based access work together so users only access the data and actions meant for them.",
    icon: ShieldCheck,
  },
];

const values = [
  {
    title: "Circular fashion",
    text: "We believe clothing should have a longer life. Reuse, resale, and donation reduce waste and create more value from every garment.",
  },
  {
    title: "Accessibility",
    text: "A sustainable wardrobe should feel practical, affordable, and simple to manage for students, families, and everyday shoppers.",
  },
  {
    title: "Transparent experiences",
    text: "From seller listings to order history and donation tracking, Thrive is designed to make each action clear and easy to follow.",
  },
];

const features = [
  "List clothes for resale in a user-driven marketplace",
  "Save items to wishlist and cart for later decisions",
  "Donate clothing and track donation progress",
  "Message buyers and sellers inside the app",
  "Manage your wardrobe, purchases, and sales history in one place",
  "Support a more conscious fashion ecosystem",
];

const reasons = [
  {
    title: "One platform, complete journey",
    text: "Instead of using separate apps for resale, donation, chat, and order tracking, Thrive brings the full clothing lifecycle together in one connected experience.",
    icon: ShoppingBag,
  },
  {
    title: "Meaningful sustainability",
    text: "The platform is not only about transactions. It also encourages responsible reuse, donation impact, and a mindset of extending the life of garments.",
    icon: Leaf,
  },
  {
    title: "Designed for trust",
    text: "Listings, profiles, messaging, and order flows are structured so users know where their items came from and how activity moves across the platform.",
    icon: BadgeCheck,
  },
];

const team = [
  {
    title: "Product vision",
    text: "The Thrive team focuses on making sustainable fashion feel practical, not complicated. The product direction centers on ease of use, trust, and real-world usefulness.",
  },
  {
    title: "Design and experience",
    text: "The interface is built to help users move smoothly between browsing, selling, donating, chatting, and tracking activity without confusion.",
  },
  {
    title: "Engineering and security",
    text: "The technical side emphasizes authenticated access, secure data handling, scalable architecture, and production-minded improvements over time.",
  },
];

const contactInfo = [
  {
    label: "Email",
    value: "ayushr8059@gmail.com",
    icon: Mail,
  },
  {
    label: "Support line",
    value: "+91 6207707493",
    icon: Phone,
  },
  {
    label: "Location",
    value: "India",
    icon: MapPin,
  },
];

export default function About() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.08 }}
      className="space-y-8"
    >
      <motion.section variants={sectionVariants} className="card overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.12),transparent_30%)]" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            About Thrive
          </div>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-dark dark:text-white lg:text-5xl">
              A fashion platform designed to make sustainable choices easier.
            </h1>
            <p className="text-base leading-7 text-gray-700 dark:text-gray-300 lg:text-lg">
              Thrive brings together resale, donation, wardrobe management, messaging, and order tracking in
              one place. The goal is simple: help people give clothes a second life while making the experience
              modern, secure, and practical.
            </p>
          </div>
          <div className="grid gap-4 pt-2 md:grid-cols-3">
            <ImpactCard icon={ShoppingBag} label="Marketplace-first" value="Resell quality items" />
            <ImpactCard icon={HeartHandshake} label="Donation support" value="Track positive impact" />
            <ImpactCard icon={ShieldCheck} label="Protected access" value="Secure user experience" />
          </div>
        </div>
      </motion.section>

      <motion.section variants={sectionVariants} className="grid gap-6 lg:grid-cols-3">
        {highlights.map(({ title, description, icon: Icon }) => (
          <article key={title} className="card h-full">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-dark dark:text-white">{title}</h2>
            <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">{description}</p>
          </article>
        ))}
      </motion.section>

      <motion.section variants={sectionVariants} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card">
          <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">What Thrive helps users do</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-4 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">Our approach</h2>
          <div className="space-y-4">
            {values.map((value) => (
              <div key={value.title} className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-slate-700">
                <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">{value.title}</h3>
                <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section variants={sectionVariants} className="card">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="mb-3 text-2xl font-bold text-dark dark:text-white">Why this matters</h2>
            <p className="max-w-4xl text-sm leading-7 text-gray-700 dark:text-gray-300 lg:text-base">
              Fast fashion creates unnecessary waste, but many clothes still have plenty of life left in them.
              Thrive gives users a structured way to sell, donate, and manage garments responsibly while staying
              connected through secure profiles, orders, notifications, and conversation flows. The platform is
              meant to make sustainable behavior feel normal, convenient, and worthwhile.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Sustainable style, practical choices.
          </div>
        </div>
      </motion.section>

      <motion.section variants={sectionVariants} className="grid gap-6 lg:grid-cols-3">
        {reasons.map(({ title, text, icon: Icon }) => (
          <article key={title} className="card h-full">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-dark dark:text-white">Why choose Thrive</h2>
            <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">{text}</p>
          </article>
        ))}
      </motion.section>

      <motion.section variants={sectionVariants} className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="card">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark dark:text-white">Our team</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A focused team working to make fashion reuse more practical and trustworthy.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {team.map((member) => (
              <div
                key={member.title}
                className="rounded-2xl border border-slate-200/80 bg-white/60 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">{member.title}</h3>
                <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">{member.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <MessagesSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark dark:text-white">Contact us</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reach out for support, feedback, partnerships, or platform questions.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {contactInfo.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/60 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="mt-1 text-base font-semibold text-dark dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
            Thrive welcomes user suggestions because a better sustainable platform is built through real feedback,
            continuous improvements, and community trust.
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

function ImpactCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/60 px-5 py-5 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-dark dark:text-white">{value}</p>
    </div>
  );
}
