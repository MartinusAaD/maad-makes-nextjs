"use client";

import { useState, useEffect, useMemo } from "react";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import FormFieldset from "@/components/Form/FormFieldset";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormError from "@/components/Form/FormError";
import Button from "@/components/Button/Button";
import Alert from "@/components/Alert/Alert";
import useFormValidation from "@/hooks/useFormValidation";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { database } from "@/lib/firestoreConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faTimes,
  faUser,
  faEnvelope,
  faStar,
  faClock,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { Timestamp } from "firebase/firestore";

type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  character: string;
  done?: boolean;
  createdAt?: Timestamp;
};

type WaitlistFormData = {
  name: string;
  email: string;
  character: string;
};

type AlertState = {
  alertMessage: string;
  type: "success" | "error" | "info" | "warning";
};

export default function WaitlistPage() {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingIds, setTogglingIds] = useState(new Set<string>());

  const fetchWaitlist = async () => {
    setLoadingList(true);
    try {
      const q = query(
        collection(database, "waitlist"),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);
      setWaitlist(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as WaitlistEntry),
      );
    } catch {
      // silently fail
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const validationRules = () => ({
    name: {
      required: { message: "Please enter their name" },
    },
    email: {
      required: { message: "Please enter their email address" },
      email: { message: "Please enter a valid email address" },
    },
    character: {
      required: { message: "Please enter the character name" },
    },
  });

  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    hasError,
    isSubmitting,
  } = useFormValidation<WaitlistFormData>(
    { name: "", email: "", character: "" },
    validationRules,
  );

  const onSubmit = async (data: WaitlistFormData) => {
    try {
      await addDoc(collection(database, "waitlist"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      setAlert({
        alertMessage: `${data.name} has been successfully added to the waitlist.`,
        type: "success",
      });
      resetForm();
      setShowForm(false);
      fetchWaitlist();
    } catch (error) {
      console.log(error.message);
      setAlert({ alertMessage: "Could not add to waitlist", type: "error" });
    }
  };

  const filteredWaitlist = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return waitlist;
    return waitlist.filter(
      (entry) =>
        entry.name?.toLowerCase().includes(q) ||
        entry.character?.toLowerCase().includes(q),
    );
  }, [waitlist, search]);

  const toggleDone = async (entry: WaitlistEntry) => {
    if (togglingIds.has(entry.id)) return;
    setTogglingIds((prev) => new Set(prev).add(entry.id));
    try {
      await updateDoc(doc(database, "waitlist", entry.id), {
        done: !entry.done,
      });
      setWaitlist((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, done: !e.done } : e)),
      );
    } catch {
      setAlert({ alertMessage: "Could not update entry.", type: "error" });
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 bg-bg-light py-6 min-h-screen">
      <ResponsiveWidthWrapper>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold">Waitlist</h1>
            <p className="text-gray-500 mt-1">
              Character design waitlist entries
            </p>
          </div>
        </div>

        {!showForm && (
          <Button
            className="w-auto shrink-0 px-4 mb-6"
            onClick={() => setShowForm(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add to Waitlist
          </Button>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormFieldset legend="Add to Waitlist">
                <FormGroup>
                  <FormLabel htmlFor="name">Name:</FormLabel>
                  <FormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Customer name"
                    error={hasError("name")}
                    autoComplete="off"
                  />
                  <FormError error={errors.name} />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="email">Email:</FormLabel>
                  <FormInput
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="customer@example.com"
                    error={hasError("email")}
                    autoComplete="off"
                  />
                  <FormError error={errors.email} />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="character">Character:</FormLabel>
                  <FormInput
                    type="text"
                    id="character"
                    name="character"
                    value={formData.character}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Character name"
                    error={hasError("character")}
                    autoComplete="off"
                  />
                  <FormError error={errors.character} />
                </FormGroup>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add to Waitlist"}
                  </Button>
                  <Button
                    type="button"
                    className="bg-gray-200 border-gray-300 text-dark hover:bg-gray-300"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </FormFieldset>
            </form>
          </div>
        )}

        <div className="relative mb-4">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or character..."
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        {loadingList ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredWaitlist.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {search ? "No entries match your search." : "No entries yet."}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">
              {filteredWaitlist.length}{" "}
              {filteredWaitlist.length === 1 ? "entry" : "entries"}
              {search && ` matching "${search}"`}
            </p>
            <div className="flex flex-col gap-3">
              {filteredWaitlist.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
                    entry.done
                      ? "bg-gray-50 border-gray-200 opacity-60"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDone(entry)}
                    disabled={togglingIds.has(entry.id)}
                    title={entry.done ? "Mark as pending" : "Mark as done"}
                    className="shrink-0 text-xl transition-colors disabled:opacity-40"
                  >
                    <FontAwesomeIcon
                      icon={entry.done ? faCheckCircle : faCircle}
                      className={
                        entry.done
                          ? "text-green-500"
                          : "text-gray-300 hover:text-gray-400"
                      }
                    />
                  </button>

                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                    {index + 1}
                  </div>

                  <div
                    className={`flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm ${entry.done ? "line-through text-gray-400" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-gray-400 w-4"
                      />
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-gray-400 w-4"
                      />
                      <span>{entry.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faStar}
                        className="text-gray-400 w-4"
                      />
                      <span>{entry.character}</span>
                    </div>
                  </div>

                  {entry.createdAt?.toDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <FontAwesomeIcon icon={faClock} />
                      <span>
                        {entry.createdAt.toDate().toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </ResponsiveWidthWrapper>

      {alert && (
        <Alert
          alertMessage={alert.alertMessage}
          type={alert.type}
          duration={5000}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}
