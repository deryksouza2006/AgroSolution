export const farmKeys = {
  all: ['farms'] as const,
  lists: () => [...farmKeys.all, 'list'] as const,
  list: (page: number, size: number) => [...farmKeys.lists(), page, size] as const,
  detail: (id: number) => [...farmKeys.all, 'detail', id] as const,
};
