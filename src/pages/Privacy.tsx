import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Studio
        </Link>

        <h1 className="text-3xl md:text-4xl font-fraunces font-bold text-foreground mb-8">
          Privacy & Terms
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground leading-relaxed">
            The Relational Tech Studio is part of the{" "}
            <a
              href="https://relationaltechproject.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Relational Tech Project
            </a>
            , a project of Raft Foundation, a NY, USA-based 501(c)(3) nonprofit
            with a mission to bring communities together to support neighbors in
            need through programs focused on collective care, community
            technology, movement infrastructure, and societal transformation.
          </p>

          {/* What We Collect */}
          <section>
            <h2 className="text-xl md:text-2xl font-fraunces font-bold text-foreground mb-4 flex items-center gap-2">
              🛠 What We Collect (and Why)
            </h2>
            <p className="text-muted-foreground mb-4">
              We only collect the information you choose to share with us
              through this site. Specifically:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>
                <strong>Account & Profile:</strong> Your email, name, neighborhood,
                and dreams/goals, so we can personalize your experience and
                support your building journey.
              </li>
              <li>
                <strong>Library Contributions:</strong> Stories, prompts, and
                tools you share, so others can learn and build alongside you.
              </li>
              <li>
                <strong>Vision Board:</strong> Images you upload to your personal
                vision board.
              </li>
            </ul>
            <div className="mt-4 space-y-2 text-muted-foreground">
              <p>We use this information only for the purposes you'd expect.</p>
              <p className="font-medium">We do not sell or share your data.</p>
              <p>We do not use tracking cookies.</p>
              <p>You can ask us to delete your information at any time.</p>
            </div>
          </section>

          {/* Age Requirement */}
          <section>
            <p className="text-muted-foreground">
              This site is intended for people age 14 and older.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl md:text-2xl font-fraunces font-bold text-foreground mb-4 flex items-center gap-2">
              🤝 Your Rights
            </h2>
            <p className="text-muted-foreground mb-4">
              You can contact us anytime at{" "}
              <a
                href="mailto:humans@relationaltechproject.org"
                className="text-primary hover:underline"
              >
                humans@relationaltechproject.org
              </a>{" "}
              to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>See what information we have about you</li>
              <li>Request a copy or deletion of your data</li>
              <li>Share feedback or concerns</li>
              <li>Start a conversation</li>
            </ul>
            <p className="mt-4 text-muted-foreground font-medium">We'll listen.</p>
          </section>

          {/* Terms of Use */}
          <section>
            <h2 className="text-xl md:text-2xl font-fraunces font-bold text-foreground mb-4 flex items-center gap-2">
              📜 Terms of Use
            </h2>
            <p className="text-muted-foreground mb-4">
              Please use this site with care and respect – for yourself, for
              others, and for the shared spaces we're co-creating.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>
                You're responsible for your own actions when participating
                through this site or at related gatherings.
              </li>
              <li>
                We don't endorse user content or take responsibility for how
                people act.
              </li>
              <li>
                We accept no liability for what happens online or offline in
                spaces related to this site. However, we do offer support for
                repair – please reach out.
              </li>
              <li>
                While this project operates all across the USA, disputes are
                subject to NY laws.
              </li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              We may update these terms, but we'll always keep them clear,
              simple, and human.
            </p>
          </section>

          {/* Community Care */}
          <section>
            <h2 className="text-xl md:text-2xl font-fraunces font-bold text-foreground mb-4 flex items-center gap-2">
              💛 Community Care & Repair
            </h2>
            <p className="text-muted-foreground">
              Relational work can get messy. Misunderstandings happen. We
              believe in slowing down, listening, and trying again. If something
              needs care or repair, we're here to help hold that process – with
              respect for all involved.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>Made with care for neighbors everywhere</p>
        </footer>
      </div>
    </div>
  );
};

export default Privacy;
