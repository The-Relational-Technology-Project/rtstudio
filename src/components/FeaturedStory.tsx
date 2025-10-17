import { Link } from "react-router-dom";
import flyerImage from "@/assets/flyer.png";
import coffeeAndDonutsImage from "@/assets/coffee_and_donuts.jpeg";
import whatsappFeedbackImage from "@/assets/whatsapp_feedback.png";
import birthdaySupplySiteImage from "@/assets/birthday_supply_site.png";
import blockPartyImage from "@/assets/block_party.png";
import chalkFlyersImage from "@/assets/chalk_flyers.png";

export const FeaturedStory = () => {
  return <article className="mb-8 sm:mb-12">
      <div className="border-l-4 border-l-accent bg-card rounded-lg overflow-hidden shadow-lg">
        <div className="p-6 sm:p-8 lg:p-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-fraunces mb-4 sm:mb-6">
            An Outer Sunset Story
          </h2>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none space-y-4 sm:space-y-6">
            <p className="lead text-base sm:text-lg leading-relaxed">
              Looking across the street in January, I wanted to know my neighbors. I wanted them to know me. I wanted them to know I cared about them, and I wanted to know they cared about my kids. It felt like a clear call to action. I had experienced the disconnectedness that so many of us feel in American culture, and at some level I knew it didn't need to stay this way. This story is an account of relational tech happenings in my neighborhood this year. Of course, it's an incomplete picture.
            </p>

            <p>
              Our first piece of relational tech was a small paper flyer that I co-created and co-distributed with my five-year-old daughter. We invited neighbors to a coffee and donuts hangout, just to say hello and consider forming a group.
            </p>

            <img src={flyerImage} alt="Coffee and donuts flyer invitation" className="w-full rounded-lg my-6" />

            <p>
              The next tool was a sign-up sheet sitting beside the donuts. It gathered contact info, ideas, and votes on our block nickname ("Cozy Corner"). Neighbors also left little notes of gratitude (unprompted, very sweet) that became visible to all.
            </p>

            <img src={coffeeAndDonutsImage} alt="Coffee and donuts gathering in the neighborhood" className="w-full rounded-lg my-6" />

            <p>
              From there, we set up a WhatsApp group and I built a simple <Link to="/prompt-pond#2285c760-50c0-4175-8b20-e361da86f391" className="text-primary hover:underline font-medium">neighbor hub</Link> at cozycorner.place. The stated point of the group was "support each other and plan our next party." When I asked what kind of party, people suggested closing the street so kids could play and everyone would know something social was happening. Soon we were planning our first block party.
            </p>

            <p>
              My favorite early use of the hub was a simple sign-up for <Link to="/prompt-pond#795f759e-c9e3-4d63-8890-21dd8283dcb5" className="text-primary hover:underline font-medium">block party jobs and supplies</Link>. I could see coverage and gaps at a glance, then draft a day-of plan that went to 20+ volunteers. It was surreal to watch someone wave hello on the sidewalk, then minutes later sign up to help out.
            </p>

            <p>
              As I paid attention to other block parties and third spaces, I noticed plenty of activity but no digital bulletin board. That inspired <Link to="/prompt-pond#3e51e21f-79df-40a3-9a0a-3687e6ab2f1d" className="text-primary hover:underline font-medium">Outer Sunset Today</Link>, a neighborhood calendar that pulls from dozens of sites and menus into one place. It lets anyone upload a flyer, which AI scans and formats for review. People were really excited to see this! Building this also led me to sketch out a <a href="https://github.com/The-Relational-Technology-Project/neighborhood-api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Neighborhood API</a>: a shared format for how neighbors, stewards, and organizations might publish events and updates and other things relevant to neighborhood life, with the Outer Sunset as a reference implementation.
            </p>

            <img src={whatsappFeedbackImage} alt="WhatsApp feedback about Outer Sunset Today" className="w-full max-w-sm mx-auto rounded-lg my-6" />

            <p>
              Mid-spring, a friend mentioned buying party supplies they wanted other families to use, too. He had this intention but no system to offer them up. That night I built the first version of <Link to="/prompt-pond#32f40f6c-879c-4269-bee7-01362ed8ea8f" className="text-primary hover:underline font-medium">Community Supplies</Link> and texted him the link! Our local mutual aid group picked it up weeks later, asking me if they could spread it into parents' groups.
            </p>

            <img src={birthdaySupplySiteImage} alt="Text conversation about Community Supplies site" className="w-full max-w-sm mx-auto rounded-lg my-6" />

            <p>
              Other pieces fell into place as needed: a custom linktree-like site at byfor.us to help me do neighborhood demos, a human-readable <Link to="/prompt-pond#479bb82a-7276-4aba-8f6a-0e16f707dd4e" className="text-primary hover:underline font-medium">privacy and terms page</Link>, and a <Link to="/prompt-pond#65bfd6d7-b686-489e-8934-9261494a8fcf" className="text-primary hover:underline font-medium">reusable footer</Link> that invited remixing each tool.
            </p>

            <p>
              For the September block party, we spread the word through email, chats, posters, and chalk signs. I printed handouts to orient folks, introduce the hub and WhatsApp, and share ideas for neighbor coupons and resilience frameworks (the wind kept us from using them all that day, rocks kept the critical ones in sight). The joyful party itself seeded the next round of ideas: digital coupons, a disaster prep page, and a system to extend microgrants for gatherings across SF. (Perhaps other blocks could get support for mini gatherings in the Spring and larger gatherings in the Fall.)
            </p>

            <img src={blockPartyImage} alt="September block party with neighbors gathered" className="w-full rounded-lg my-6" />

            <img src={chalkFlyersImage} alt="Chalk sign announcing neighbor block party" className="w-full rounded-lg my-6" />

            <p>
              It's worth noting that some experiments are on pause. A local organizer imagined using the same tools to care for Sunset Dunes Park, starting with community-led sand abatement. The organizing tool is ready, but because the park is so politically charged, we've held off for now.
            </p>

            <p>
              Meanwhile, my curiosity about neighbors' stories grew! Inspired by the Human Library project, I created <Link to="/prompt-pond#a51ad35d-afd8-4142-8d58-2aebe90b62d1" className="text-primary hover:underline font-medium">Neighbor Stories</Link> as a way to organize small circles in local third spaces. My first attempt asked neighbors to propose stories – but the initial group was unsure of what to propose. Recently, I flipped the design to shared prompts that anyone could answer. My next step is to print flyers with QR codes for little free libraries.
            </p>

            <p className="text-base sm:text-lg font-medium bg-secondary/30 border border-border p-4 sm:p-6 rounded-xl mt-8">
              Through all this, the most powerful shift has been relational. Each experiment produced not just a tool but a thread – something to share, talk about, respond to, or evolve with care. The more we create together, the more ideas flow back, and the stronger our ties become. What started with a flyer and some donuts now feels like the beginnings of an ecosystem.
            </p>
          </div>
        </div>
      </div>
    </article>;
};
