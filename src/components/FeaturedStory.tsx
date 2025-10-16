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
              I came to this work on social connection after more than a decade in global health. For years, I worked alongside community health workers in villages across Africa and Asia – ordinary people who took extraordinary responsibility for the well-being of their neighbors, treated as extended family. When I returned and re-rooted in the United States, I realized I had been overlooking the frayed social fabric right in front of me. Our disconnection here was not only eroding our quality of life but stunting our collective imagination about what we might accomplish together. It was a coming-home moment for me: to do the work of connection not "out there" but in the neighborhood where I live, raising my kids, alongside the people next door.
            </p>

            <h3 className="text-xl sm:text-2xl font-bold mt-8 mb-4">Creating Mini-Cultures of Care</h3>
            
            <p>
              Different parts of ourselves are summoned by the digital, physical, and social structures around us. We can choose to create new "mini cultures" with others through action – homegrown infrastructures that bring forward our natural capacities to care and cooperate. For me, this began with the most humble experiment: coffee and donuts in our driveway.
            </p>

            <div className="my-6 sm:my-8">
              <img src={neighborsImage} alt="Neighbors connecting at a coffee and donuts gathering" className="w-full rounded-lg" />
            </div>

            <p>
              We put a flyer on the block, taped one to our front window, and invited neighbors to drop by. A handwritten note arrived in our mailbox the next day thanking us for the invitation. The day of the gathering, we saw neighbors walk towards us and wondered, "Are they coming to get coffee?" (They were – two dozen people came by!) People who had lived next to one another for years had their <em>first conversation</em> that morning. A small, meaningful, public invitation started to create a mini culture of care and connection on our block.
            </p>

            <p>
              We decided to form a neighbor group with the purpose of "supporting each other and planning our next party." That first driveway gathering grew into a full <strong>block party</strong>, complete with a pirate-ship bouncy house, local musicians, tacos, chalk art, and the kind of laughter that makes a street feel alive. People met neighbors they had never spoken to before. Elders came outside for the first time in months and were greeted with warmth. At the end of the day, over a hundred and fifty people had spent time together, and the collective feeling was clear: "We do this kind of thing here." That conviction – this is the kind of place where neighbors show up for one another – becomes social infrastructure. Reciprocity starts to create healthy relational soil.
            </p>

            <div className="my-6 sm:my-8">
              <img src={blockPartyImage} alt="Cozy Corner block party with pirate ship bouncy house and neighbors gathering" className="w-full rounded-lg" />
            </div>

            

            

            <p>
              "What do you have to offer?" is not the same as "What is your job skill?" It invites the whole self to show up – whether that's fixing bikes, teaching a recipe, or listening with care. "What do you need?" is vulnerable and rarely asked between colleagues or neighbors. Naming needs allows others to step toward us with generosity – this is how our brains are meant to work! "What are you dreaming about?" leads to wonderful surprises. We've learned that people long to share their dreams, and when they do, it awakens curiosity and energy in others.
            </p>

            

            <div className="my-6 sm:my-8">
              
            </div>

            <h3 className="text-xl sm:text-2xl font-bold mt-8 mb-4">Technology as Relational Craft</h3>

            <p>
              I believe technology has a role to play in the project of our times: reconnecting with the people around us. But the way we create and use technology must be different. Too often, technology sorts us into rigid roles of user and platform, consumer and product. It consolidates power and extracts value.
            </p>

            <p>
              Relational technology, as we've come to call it, is built to support care, not to replace it. It is created by communities, not for them. It is human-scale, sharable, and remixable. A piece of relational tech can be as simple as a clipboard at a block party, or as sophisticated as a small piece of software that helps neighbors plan gatherings.
            </p>

            <p>The departures from business-as-usual tech design are clear:</p>

            <ul className="space-y-2 ml-4 sm:ml-6 mb-6">
              <li><strong>Purpose:</strong> reconnecting and caring for one another, not profit.</li>
              <li><strong>Process:</strong> embedded design in everyday life, not experts designing from afar.</li>
              <li><strong>Math:</strong> a ratio of one builder to ten co-creators, not one to a million "users."</li>
              <li><strong>Path:</strong> scaling deep and horizontally, not top-down platforms that flatten diversity.</li>
            </ul>

            <p>
              In this frame, building software is care work. Feedback loops are tight and relational because you know the people relying on it. Code is transparent, remixable, and co-stewarded. This is technology as craft and community service.
            </p>

            <div className="my-6 sm:my-8">
              
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

            <h3 className="text-xl sm:text-2xl font-bold mt-8 mb-4">Care, Cooperation, Curiosity</h3>

            <p>
              In neighborhoods across the US, we are seeing people gather to talk and play, share their stories and stuff, and act on plans together. Care, cooperation, and curiosity are not abstract ideals – they are the building blocks of every collective action we're experiencing.
            </p>

            <p>
              These are not qualities we have to manufacture. They are capacities already within us, waiting for the right conditions and invitations. My work in my community is about creating those conditions – small cultural infrastructures, local experiments, and tools that invite us to remember and practice who we already are. Our work at the Relational Tech Project is to create a new commons for this cultural project: community knowledge about how to build differently, remixable examples that can spread from neighborhood to neighborhood, and an open-source toolkit that becomes our workbench for relational technology.
            </p>

            <p>
              The Outer Sunset story is one thread in a bigger tapestry. Across neighborhoods and towns, people are not waiting for platforms — we're making them, hyper-locally, with the people around us. Sometimes they're flyers and clipboards. Sometimes they're shared spreadsheets or little websites. Sometimes they're small, home-cooked apps. The point isn't scale — it's whether what we build brings us closer.
            </p>

            <p>
              I am in pursuit of generalized reciprocity at the neighborhood level: the loops of caring about, for, and with one another. I believe we can act this out publicly, and then feel it together. In that practice lies the possibility of transforming not only our neighborhoods, but the culture of disconnection itself.
            </p>

            <p className="text-base sm:text-lg font-medium bg-secondary/30 border border-border p-4 sm:p-6 rounded-xl">
              So here's my invitation: take any of this — coffee and donuts, a group chat, an offers-needs-dreams circle, a neighbor hub, a local event site, a story circle — and <strong>remix it for your own unfolding story</strong>. Try something humble, and see what happens when people show up, care for each other, and build together. That's how new culture takes root.
            </p>
          </div>
        </div>
      </div>
    </article>;
};