"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

export interface UserOption {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface OwnerSearchSelectProps {
  users: UserOption[];
  isLoading: boolean;
  selectedUserId: string | null | undefined;
  selectedUserName: string | null | undefined;
  onSelect: (user: UserOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const OwnerSearchSelect: React.FC<OwnerSearchSelectProps> = ({
  users,
  isLoading,
  selectedUserId,
  selectedUserName,
  onSelect,
  placeholder = "-- Pilih Pemilik (Ketik untuk mencari) --",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevSelectedUserId, setPrevSelectedUserId] = useState(selectedUserId);
  const [prevSelectedUserName, setPrevSelectedUserName] = useState(selectedUserName);
  const [prevUsers, setPrevUsers] = useState(users);

  if (
    selectedUserId !== prevSelectedUserId ||
    selectedUserName !== prevSelectedUserName ||
    users !== prevUsers
  ) {
    setPrevSelectedUserId(selectedUserId);
    setPrevSelectedUserName(selectedUserName);
    setPrevUsers(users);

    const found = users.find((u) => u.id === selectedUserId);
    if (found) {
      setSearchQuery(found.name);
    } else if (selectedUserId && selectedUserName && selectedUserName !== "-") {
      setSearchQuery(selectedUserName);
    } else {
      setSearchQuery("");
    }
  }

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId);
  }, [users, selectedUserId]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.phone && u.phone.toLowerCase().includes(query))
    );
  }, [searchQuery, users]);

  // Handle click outside to close options and reset query to selected value
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset search query to selected user name if it doesn't match
        if (selectedUser) {
          setSearchQuery(selectedUser.name);
        } else if (selectedUserId && selectedUserName && selectedUserName !== "-") {
          setSearchQuery(selectedUserName);
        } else {
          setSearchQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedUser, selectedUserId, selectedUserName]);

  const handleSelectOption = (user: UserOption) => {
    onSelect(user);
    setSearchQuery(user.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          disabled={disabled || isLoading}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value.trim()) {
              onSelect(null);
            }
          }}
          onFocus={() => {
            if (!disabled && !isLoading) {
              setIsOpen(true);
            }
          }}
          placeholder={isLoading ? "Memuat data warga..." : placeholder}
          className="w-full rounded-xl border border-gray-border bg-gray-card py-3 pl-4 pr-10 text-gray-heading-main placeholder-gray-placeholder text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-placeholder" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 text-gray-placeholder transition-transform duration-200 ${
                isOpen ? "transform rotate-180 text-primary" : ""
              }`}
            />
          )}
        </div>
      </div>

      {isOpen && !isLoading && (
        <div className="absolute left-0 z-50 w-full rounded-xl border border-gray-border bg-gray-card p-1.5 shadow-xl max-h-56 overflow-y-auto outline-none animate-in fade-in duration-150 mt-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {searchQuery.trim() && (
            <div
              onClick={handleClear}
              className="flex items-center rounded-lg py-2 px-2.5 cursor-pointer text-xs text-error hover:bg-gray-sidebar-hover font-medium border-b border-gray-border/40 mb-1"
            >
              -- Hapus Pilihan Pemilik --
            </div>
          )}
          
          {filteredUsers.length === 0 ? (
            <div className="py-3 px-2.5 text-xs text-gray-placeholder text-center">
              Tidak ada warga terdaftar yang cocok
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = u.id === selectedUserId;
              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectOption(u)}
                  className={`flex flex-col gap-0.5 rounded-lg py-2 px-2.5 cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover"
                  }`}
                >
                  <span className="font-medium text-gray-heading-main">{u.name}</span>
                  <span className="text-[10px] text-gray-placeholder">
                    {u.phone ? `WA/Telp: ${u.phone}` : u.email ? `Email: ${u.email}` : "Tidak ada detail kontak"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
