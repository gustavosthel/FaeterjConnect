package com.faeterjconnect.faeterjconnect.dto;

import java.util.List;

public record CursorPage<T>(
        List<T> items,
        String nextCursor
) {}

