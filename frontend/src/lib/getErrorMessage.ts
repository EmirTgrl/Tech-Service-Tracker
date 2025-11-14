export const getErrorMessage = (error: unknown): string => {
  let message = "An unexpected error has occurred. Please try again..";

  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          error?: string;
        };
      };
    };

    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
  }

  if (error instanceof Error) {
    message = error.message;
  }

  return message;
};
