import { useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  setNewslettersSearch,
  setNewslettersCategory,
  setNewslettersPage,
  fetchNewsletters,
} from "@/store/slices/newsletterSlice";

/**
 * Custom hook for managing newsletter filter state and actions
 * Eliminates duplication between student and admin pages
 */
export function useNewsletterFilters() {
  const dispatch = useAppDispatch();
  const {
    newslettersSearch,
    newslettersCategory,
    newslettersPagination,
    loadingNewsletters,
  } = useAppSelector((state) => state.newsletters);

  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
    },
    []
  );

  const handleSearchSubmit = useCallback(() => {
    dispatch(setNewslettersSearch(searchInput));
  }, [searchInput, dispatch]);

  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      dispatch(setNewslettersCategory(category));
    },
    [dispatch]
  );

  const handlePreviousPage = useCallback(() => {
    if (newslettersPagination && newslettersPagination.page > 1) {
      const newPage = newslettersPagination.page - 1;
      dispatch(setNewslettersPage(newPage));
      dispatch(
        fetchNewsletters({
          page: newPage,
          search: newslettersSearch,
          category: newslettersCategory,
        }) as any
      );
    }
  }, [newslettersPagination, newslettersSearch, newslettersCategory, dispatch]);

  const handleNextPage = useCallback(() => {
    if (
      newslettersPagination &&
      newslettersPagination.page < newslettersPagination.totalPages
    ) {
      const newPage = newslettersPagination.page + 1;
      dispatch(setNewslettersPage(newPage));
      dispatch(
        fetchNewsletters({
          page: newPage,
          search: newslettersSearch,
          category: newslettersCategory,
        }) as any
      );
    }
  }, [newslettersPagination, newslettersSearch, newslettersCategory, dispatch]);

  return {
    // State
    searchInput,
    selectedCategory,
    pagination: newslettersPagination,
    loading: loadingNewsletters,

    // Handlers
    handleSearch,
    handleSearchSubmit,
    handleCategoryChange,
    handlePreviousPage,
    handleNextPage,

    // Redux state
    currentSearch: newslettersSearch,
    currentCategory: newslettersCategory,
  };
}
