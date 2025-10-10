import { Link } from "react-router-dom";
import blockPartyImage from "@/assets/os-blockparty.png";
import neighborsImage from "@/assets/os-neighbors.png";
import gatheringImage from "@/assets/os-gathering.png";
import dreamsImage from "@/assets/os-dreams.png";
export const FeaturedStory = () => {
  return <article className="mb-8 sm:mb-12">
      <div className="border-l-4 border-l-accent bg-card rounded-lg overflow-hidden shadow-lg">
        <div className="p-6 sm:p-8 lg:p-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-fraunces mb-4 sm:mb-6">
            An Outer Sunset Story
          </h2>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-4 sm:space-y-6">
            <p className="lead text-base sm:text-lg leading-relaxed">
              When I walk around my neighborhood, I want my neighbors to know I care about them. I want them to know I care about what's important to them, what they need, and what they're dreaming about. That's the heart of what's happening in the Outer Sunset right now.
            </p>

            <div className="my-6 sm:my-8">
              <img src={neighborsImage} alt="Neighbors connecting at a coffee and donuts gathering" className="w-full rounded-lg" />
            </div>

            <p>
              It started simply: <strong>coffee and donuts in the driveway</strong>. A flyer taped to our window, a handful tucked into doorways, and a month later, dozens of neighbors stopped by. We drank coffee from Sunset Roasters, shared Twisted Donuts and babka, and some people who had lived side-by-side for years had their <em>first conversation</em>. At the end of the morning, we had a new group chat and even a name for our little pocket of the neighborhood: <strong>Cozy Corner</strong>.
            </p>

            <p>
              That humble hangout grew into something bigger: our first full-on <strong>block party</strong>. Right in the middle of San Francisco's first Good Neighbor Week, we brought in a pirate ship bouncy house, a neighborhood music circle, and a rockin' set from a local band in front of our garage. Kids chalked the pavement, neighbors played volleyball and scootered through the street, and old friends and total strangers found themselves sharing tacos and stories together. More than 125 people came, and by the end of the night there was no question: this will be an annual tradition.
            </p>

            <div className="my-6 sm:my-8">
              <img src={blockPartyImage} alt="Cozy Corner block party with pirate ship bouncy house and neighbors gathering" className="w-full rounded-lg" />
            </div>

            <p>
              The wisdom of block parties is this: they change what feels possible on a street. They turn neighbors into friends, friends into stewards, and streets into commons. They remind us that the most powerful form of safety and resilience is <strong>general reciprocity</strong> — the feeling that we're all looking out for one another.
            </p>

            <p>
              And here's where relational tech comes in. Flyers on telephone poles are relational tech. A shared spreadsheet of neighbor needs is relational tech. A WhatsApp group or a simple neighbor hub website is relational tech. These tools don't replace relationships — they make them visible, accessible, and easier to practice. They puncture our day-to-day with surprisingly awesome invitations, flowing like a community river of possibilities.
            </p>

            <div className="my-6 sm:my-8">
              <img src={gatheringImage} alt="Neighbors gathering and connecting" className="w-full rounded-lg" />
            </div>

            <p>Lately, we've been building some new ones together:</p>

            <ul className="space-y-2 ml-4 sm:ml-6">
              <li>
                <strong>Outer Sunset Today</strong> — a little site that pulls together local events, daily menus, and even a weather widget that calls out "blue days" (clear skies, thanks to neighbor Dan). You can upload a flyer, snap a chalkboard, or add a link. It's free, for fun, for us — and it makes it easier to plan a day in the neighborhood, together.
              </li>
              <li>
                <strong>Community Supplies</strong> — a way to start sharing party supplies, already in motion from our block party. We expect this to grow into tool-sharing and other everyday exchanges.
              </li>
              <li>
                <strong>Neighbor Stories</strong> — a simple sign-up for story circles at local coffee shops, built on the belief that <em>the shortest distance between two people is a story</em>. Folks can express interest in questions they'd like to answer, then gather. It'll feel so good that it will spread.
              </li>
            </ul>

            <div className="my-6 sm:my-8">
              
            </div>

            <p>
              What's unique about this work is that it's <strong>embodied design</strong>. It's not happening in a vacuum, or in a lab — it's happening amidst everyday walks, park hangs, kid birthday parties, school pick-ups, and humble coffee and pizza gatherings. A tool takes shape in lived experience, and when it feels ready, it goes out to a handful of people. They shape it for the next dozens, who shape it for the next concentric circle. That's how it grows.
            </p>

            <p>
              We've been experimenting with what I call <strong>small software</strong> — tools built not for millions, but for dozens. They're cozy, human-scale, and easy to remix. They keep feedback loops short and meaningful because you actually know the people using them. This is software as care work.
            </p>

            <p>In the Outer Sunset, relational tech looks like:</p>

            <ul className="space-y-2 ml-4 sm:ml-6">
              <li>
                <strong>Coffee & Donuts Rituals</strong> — lightweight invites anyone can remix.
              </li>
              <li>
                <strong>Offers, Needs, and Dreams</strong> — surfacing hidden gifts and real needs so connection feels like care.
              </li>
              <li>
                <Link to="/prompt-pond" className="text-primary hover:underline font-semibold">
                  Hyperlocal Neighbor Hubs
                </Link> — simple sites that collect events, resources, and stories in one place.
              </li>
              <li>
                <strong>Block Party Kits</strong> — practical tools, from checklists to neighbor coupons, for turning streets into commons.
              </li>
              <li>
                <strong>New Experiments</strong> — like Outer Sunset Today, Community Supplies, and Neighbor Stories — which can be remixed by any neighborhood.
              </li>
            </ul>

            <p>
              The Outer Sunset story is one thread in a bigger tapestry. Across neighborhoods and towns, people are not waiting for platforms — we're making them, hyper-locally, with the people around us. Sometimes they're flyers and clipboards. Sometimes they're shared spreadsheets or little websites. Sometimes they're small, home-cooked apps. The point isn't scale — it's whether what we build brings us closer.
            </p>

            <p className="text-base sm:text-lg font-medium bg-secondary/30 border border-border p-4 sm:p-6 rounded-xl">
              So here's my invitation: take any of this — coffee and donuts, a group chat, an offers-needs-dreams circle, a neighbor hub, a local event site, a story circle — and <strong>remix it for your own unfolding story</strong>. Try something humble, and see what happens when people show up, care for each other, and build together. That's how new culture takes root.
            </p>
          </div>
        </div>
      </div>
    </article>;
};