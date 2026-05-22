import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopNav } from "@/components/TopNav";
import { LibraryAdminTab } from "@/components/admin/LibraryAdminTab";
import { ContributionsTab } from "@/components/admin/ContributionsTab";
import { BuildersTab } from "@/components/admin/BuildersTab";
import { StudioLogTab } from "@/components/admin/StudioLogTab";
import { EmbeddingsTab } from "@/components/admin/EmbeddingsTab";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl mb-6">Studio Admin</h1>
        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="builders">Builders</TabsTrigger>
            <TabsTrigger value="studio_log">Studio Log</TabsTrigger>
            <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="mt-6"><LibraryAdminTab /></TabsContent>
          <TabsContent value="contributions" className="mt-6"><ContributionsTab /></TabsContent>
          <TabsContent value="builders" className="mt-6"><BuildersTab /></TabsContent>
          <TabsContent value="studio_log" className="mt-6"><StudioLogTab /></TabsContent>
          <TabsContent value="embeddings" className="mt-6"><EmbeddingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
