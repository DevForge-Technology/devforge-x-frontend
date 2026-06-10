import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { usersBuilder } from '../builders/users';
import { User } from '../types';

export function useUsersQuery(params?: { search?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersBuilder.list(params),
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersBuilder.getById(id),
    enabled: !!id,
  });
}

export function useMeQuery() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersBuilder.getMe(),
  });
}

export function useCreateUserMutation(
  options?: UseMutationOptions<{ user: User }, Error, { name: string; email: string; password: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersBuilder.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    ...options,
  });
}

export function useUpdateUserMutation(
  options?: UseMutationOptions<{ user: User }, Error, { id: string; name?: string; email?: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => usersBuilder.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    ...options,
  });
}

export function useDeleteUserMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersBuilder.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    ...options,
  });
}

export function useResetPasswordMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string; new_password: string }>,
) {
  return useMutation({
    mutationFn: ({ id, new_password }) => usersBuilder.resetPassword(id, new_password),
    ...options,
  });
}

export function useUpdateMeMutation(
  options?: UseMutationOptions<{ user: User }, Error, { name: string; email: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersBuilder.updateMe,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'me'] }),
    ...options,
  });
}

export function useChangePasswordMutation(
  options?: UseMutationOptions<
    { success: boolean },
    Error,
    { currentPassword: string; newPassword: string }
  >,
) {
  return useMutation({
    mutationFn: usersBuilder.changePassword,
    ...options,
  });
}
