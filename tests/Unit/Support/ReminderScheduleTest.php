<?php

use App\Support\ReminderSchedule;

uses(Tests\TestCase::class);

test('it parses mixed-unit durations into sorted, deduped minutes', function () {
    expect(ReminderSchedule::parseToMinutes('10m,6h,1d'))->toBe([10, 360, 1440]);
});

test('it sorts and dedups out-of-order input', function () {
    expect(ReminderSchedule::parseToMinutes('1d, 10m, 1440m, 6h'))->toBe([10, 360, 1440]);
});

test('it skips malformed tokens', function () {
    expect(ReminderSchedule::parseToMinutes('10m,6hh,1d'))->toBe([10, 1440]);
});

test('it skips thresholds below the 10 minute minimum', function () {
    expect(ReminderSchedule::parseToMinutes('5m,10m,1h'))->toBe([10, 60]);
});

test('isValidScheduleString accepts well-formed schedules', function () {
    expect(ReminderSchedule::isValidScheduleString('10m,6h,1d'))->toBeTrue();
});

test('isValidScheduleString rejects malformed tokens', function () {
    expect(ReminderSchedule::isValidScheduleString('10m,6hh,1d'))->toBeFalse();
});

test('isValidScheduleString rejects thresholds below the 10 minute minimum', function () {
    expect(ReminderSchedule::isValidScheduleString('5m,6h'))->toBeFalse();
});

test('isValidScheduleString rejects an empty string', function () {
    expect(ReminderSchedule::isValidScheduleString(''))->toBeFalse();
});
