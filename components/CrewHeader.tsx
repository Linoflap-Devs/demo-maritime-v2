import {
  ChevronLeft,
  Pencil,
  Save,
  X,
  Plus,
  CircleMinus,
} from "lucide-react";
import { TbUserCheck } from "react-icons/tb";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllotteeFormStore } from "@/src/store/useAllotteeFormStore";
import { useAllotteeTriggerStore } from "@/src/store/usetriggerAdd";
import { useAddAllotteeStore } from "@/src/store/useAddAllotteeStore";

interface CrewHeaderProps {
  isEditing: boolean;
  activeTab: string;
  toggleEditMode: () => void;
  saveChanges: () => void;
  handleDelete: (selectedAllottee: string) => void;
  isEditLoading: boolean;
  handleTriggerVerify: () => void;
  isVerifying: boolean;
  isCrewVerified: number | null;
  handleTriggerDecline: () => void;
  isDeclining: boolean;
  isRegistered: Date | null;
  isAddingAllottee: boolean;
  toggleAllotteeAdd: () => void;
  //handleTriggerAdd: () => void;
  isAddLoading: boolean;
  isEditingAllottee: boolean;
  toggleAllotteeEdit: () => void;
  handleSaveAllottee: () => void;
  isDeletingAllottee: boolean;
  handleSave: () => void;
  allotteeLoading?: boolean;
  handleDeleteAllottee: () => void;
}

export function CrewHeader({
  isEditing,
  activeTab,
  toggleEditMode,
  saveChanges,
  isEditLoading,
  handleTriggerVerify,
  isVerifying,
  isCrewVerified,
  handleTriggerDecline,
  isDeclining,
  isRegistered,
  isAddingAllottee,
  toggleAllotteeAdd,
  isAddLoading,
  //handleTriggerAdd,
  isEditingAllottee,
  toggleAllotteeEdit,
  allotteeLoading,
  handleSaveAllottee
}: CrewHeaderProps) {

  const { isAllotteeValid, setIsAllotteeValid } = useAllotteeFormStore();
  const setTriggerAdd = useAllotteeTriggerStore((state) => state.setTriggerAdd); // get the function

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/home/crew">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-semibold">Crew Details</h1>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={toggleEditMode}
              className="border-gray-300 w-40"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 w-40"
              onClick={saveChanges}
              disabled={isEditLoading}
            >
              {isEditLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        ) : (
          activeTab === "details" && (
            <Button
              className="bg-primary hover:bg-primary/90 w-40"
              onClick={toggleEditMode}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Crew
            </Button>
          )
        )}

        {activeTab === "allottee" && (
          <div className="px-4 pt-0 flex justify-end gap-3">
            {isEditingAllottee && !isAddingAllottee ? (
              <>  
                <Button
                  variant="outline"
                  onClick={toggleAllotteeEdit}
                  className="border-red-400 border-2 bg-white w-40 text-red-500 hover:text-red-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 w-40"
                  onClick={handleSaveAllottee}
                  disabled={allotteeLoading}
                >
                  {allotteeLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Allottee
                    </>
                  )}
                </Button>
              </>
            ) : isAddingAllottee ? (
              <>
                <Button
                  variant="outline"
                  onClick={toggleAllotteeAdd}
                  className="border-red-400 border-2 bg-white w-40 text-red-500 hover:text-red-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Add
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTriggerAdd(true);
                  }}
                  disabled={isAddLoading}
                  className="bg-primary hover:bg-primary/70 px-6 w-40 px-6 w-40 text-white hover:text-white"
                >
                  {isAddLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Allottee
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={toggleAllotteeEdit}
                  className="bg-[#2BA148] hover:bg-green-700 px-6 w-40"
                  disabled={!isAllotteeValid}
                >
                  <Pencil />
                  Edit
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/70 px-6 w-40"
                  onClick={toggleAllotteeAdd}
                >
                  <Plus />
                  Add Allottee
                </Button>
              </>
            )}
          </div>
        )}

        {activeTab === "validation" && (
          <div className="px-4 pt-0 flex justify-end gap-3">
            <Button
              variant="destructive"
              className="px-6 bg-[#B63C3C] w-40"
              disabled={isCrewVerified === 1 || isDeclining || !isRegistered}
              onClick={handleTriggerDecline}
            >
              {isDeclining ? (
                <>
                  <Loader2 className="animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <CircleMinus className="h-4 w-4 ml-2" />
                  Decline Crew
                </>
              )}
            </Button>

            <Button
              className="bg-primary hover:bg-primary/70 px-6 w-40"
              onClick={handleTriggerVerify}
              disabled={isVerifying || isCrewVerified === 1 || !isRegistered}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <TbUserCheck className="h-4 w-4 mr-2" />
                  {isCrewVerified === 1 ? <>Verified</> : <>Verify Crew</>}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
