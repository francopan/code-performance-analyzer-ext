#include <stdio.h>

// Linear-time complexity function with a simple loop
void linear_loop(int n)
{
    int i = 0;
    for (i = 0; i < n; i++)
    {
        int l = 0;
        int k = 0;
        int m = 0;
    }
}

// Linear-time function with an array iteration
void linear_array_iteration(int arr[], int n)
{
    for (int i = 0; i < n; i++)
    {
        arr[i] = arr[i] * 2;
    }
}

// // Linear-time function with conditional logic inside a loop
void linear_with_condition(int n)
{
    for (int i = 0; i < n; i++)
    {
        if (i % 2 == 0)
        {
            int even = i * 2;
        }
        else
        {
            int odd = i * 3;
        }
    }
}

// Linear-time function calculating a cumulative sum
void linear_cumulative_sum(int n)
{
    int sum = 0;
    for (int i = 0; i < n; i++)
    {
        sum += i;
    }
}

// // Linear-time function with nested independent loops (still O(n))
void linear_independent_loops(int n)
{
    for (int i = 0; i < n; i++)
    {
        int x = i * 2;
    }
    for (int j = 0; j < n; j++)
    {
        int y = j * 3;
    }
}

// Main function for testing
int main()
{
    int n;
    printf("Enter a value for n: ");
    scanf("%d", &n);

    int arr[n];
    for (int i = 0; i < n; i++)
    {
        arr[i] = i;
    }

    // Call linear - time complexity functions
    linear_loop(n);
    linear_array_iteration(arr, n);
    linear_with_condition(n);
    linear_cumulative_sum(n);
    linear_independent_loops(n);

    return 0;
}
